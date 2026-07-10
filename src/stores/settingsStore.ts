import { create } from "zustand";
import type { AppSettings } from "../types";
import { DEFAULT_SETTINGS } from "../constants";
import { getDatabase } from "../db/client";
import { settings } from "../db/client";

interface SettingsStoreState {
  settings: AppSettings;
  loaded: boolean;
  loadSettings: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: {
    jlptLevels: [...DEFAULT_SETTINGS.jlptLevels],
    sources: [...DEFAULT_SETTINGS.sources],
    dailyGoal: DEFAULT_SETTINGS.dailyGoal,
    soundEnabled: DEFAULT_SETTINGS.soundEnabled,
  },
  loaded: false,

  loadSettings: () => {
    try {
      const { db } = getDatabase();
      const rows = db.select().from(settings).all();
      const saved: Record<string, any> = {};
      for (const row of rows) {
        try {
          saved[row.key] = JSON.parse(row.value ?? "");
        } catch {
          saved[row.key] = row.value;
        }
      }
      if (Object.keys(saved).length === 0) {
        set({ loaded: true });
        return;
      }
      set({
        settings: {
          jlptLevels: saved.jlptLevels ?? [...DEFAULT_SETTINGS.jlptLevels],
          sources: saved.sources ?? [...DEFAULT_SETTINGS.sources],
          dailyGoal: saved.dailyGoal ?? DEFAULT_SETTINGS.dailyGoal,
          soundEnabled: saved.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
        },
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  updateSettings: (partial) => {
    const { settings: current } = get();
    const updated = { ...current, ...partial };
    set({ settings: updated });
    try {
      const { db } = getDatabase();
      for (const [key, value] of Object.entries(updated)) {
        db.insert(settings)
          .values({ key, value: JSON.stringify(value) })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: JSON.stringify(value) },
          })
          .run();
      }
    } catch {}
  },

  resetToDefaults: () => {
    set({
      settings: {
        jlptLevels: [...DEFAULT_SETTINGS.jlptLevels],
        sources: [...DEFAULT_SETTINGS.sources],
        dailyGoal: DEFAULT_SETTINGS.dailyGoal,
        soundEnabled: DEFAULT_SETTINGS.soundEnabled,
      },
    });
  },
}));
