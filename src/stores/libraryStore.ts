import { create } from "zustand";
import { getDatabase } from "../db/client";
import { words } from "../db/client";

export interface CustomLibrary {
  name: string;          // display name
  key: string;           // unique key for source field
  words: any[];          // [{japanese,reading,chinese_meaning,part_of_speech}]
  enabled: boolean;
  createdAt: string;
}

interface LibraryState {
  libraries: Record<string, CustomLibrary>;
  load: () => void;
  create: (name: string) => void;
  remove: (key: string) => void;
  rename: (oldKey: string, newName: string) => void;
  toggle: (key: string) => void;
  importCSV: (key: string, csvText: string) => number; // returns count imported
  exportCSV: (key: string) => string;
  getEnabledKeys: () => string[];
}

function save(libs: Record<string, CustomLibrary>) {
  try { localStorage.setItem("wordjp_libraries", JSON.stringify(libs)); } catch {}
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  libraries: {},

  load: () => {
    try {
      const raw = localStorage.getItem("wordjp_libraries");
      if (raw) set({ libraries: JSON.parse(raw) });
    } catch {}
  },

  create: (name: string) => {
    const key = "custom_" + name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const libs = { ...get().libraries };
    if (libs[key]) return;
    libs[key] = { name, key, words: [], enabled: true, createdAt: new Date().toISOString() };
    set({ libraries: libs });
    save(libs);
  },

  remove: (key: string) => {
    const libs = { ...get().libraries };
    delete libs[key];
    set({ libraries: libs });
    save(libs);
  },

  rename: (oldKey: string, newName: string) => {
    const libs = { ...get().libraries };
    const lib = libs[oldKey];
    if (!lib) return;
    const newKey = "custom_" + newName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    delete libs[oldKey];
    lib.name = newName;
    lib.key = newKey;
    libs[newKey] = lib;
    set({ libraries: libs });
    save(libs);
  },

  toggle: (key: string) => {
    const libs = { ...get().libraries };
    if (libs[key]) {
      libs[key].enabled = !libs[key].enabled;
      set({ libraries: libs });
      save(libs);
    }
  },

  importCSV: (key: string, csvText: string): number => {
    const lines = csvText.split("\n").filter((l) => l.trim());
    if (lines.length < 1) return 0;
    // Skip header if first line looks like a header
    const start = lines[0].includes("日语") || lines[0].includes("japanese") || lines[0].includes("平假名") ? 1 : 0;

    const newWords: any[] = [];
    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length < 2) continue;
      const japanese = (cols[0] || "").trim();
      const reading = (cols[1] || "").trim();
      const meaning = (cols[2] || "").trim();
      const pos = cols[3]?.trim() || null;
      if (!japanese || !meaning) continue;
      newWords.push({
        japanese,
        reading: reading || japanese,
        chinese_meaning: meaning,
        part_of_speech: pos,
      });
    }

    // Insert into database
    const { db } = getDatabase();
    let inserted = 0;
    for (const w of newWords) {
      try {
        // Get max id
        const max = db.select().from(words).all();
        const newId = (max.length > 0 ? Math.max(...max.map((x: any) => x.id)) : 0) + 1;
        db.insert(words).values({
          id: newId,
          japanese: w.japanese,
          reading: w.reading,
          chinese_meaning: w.chinese_meaning,
          part_of_speech: w.part_of_speech || null,
          jlpt_level: null,
          source: key,
          lesson: null,
        }).run();
        inserted++;
      } catch {}
    }

    // Update library
    const libs = { ...get().libraries };
    if (libs[key]) {
      libs[key].words = [...libs[key].words, ...newWords];
    }
    set({ libraries: libs });
    save(libs);
    return inserted;
  },

  exportCSV: (key: string): string => {
    const lib = get().libraries[key];
    if (!lib) return "";
    return "日语单词,读音,中文释义\n" +
      lib.words.map((w) => `${w.japanese},${w.reading},${w.chinese_meaning}`).join("\n");
  },

  getEnabledKeys: () => {
    return Object.values(get().libraries)
      .filter((l) => l.enabled)
      .map((l) => l.key);
  },
}));
