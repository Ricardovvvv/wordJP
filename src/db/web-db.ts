/**
 * Web-compatible database layer using in-memory storage.
 * Used when running on web (expo-sqlite not available on web).
 *
 * Exports objects that mimic Drizzle ORM's table/column API so existing
 * service code works without changes on both platforms.
 */
import { Platform } from "react-native";

// Column proxy — words.id returns "id", etc.
function table<T extends Record<string, string>>(name: string, cols: T): T & { _table: string } {
  return Object.assign(cols, { _table: name });
}

export const words = table("words", {
  id: "id",
  japanese: "japanese",
  reading: "reading",
  chinese_meaning: "chinese_meaning",
  part_of_speech: "part_of_speech",
  jlpt_level: "jlpt_level",
  source: "source",
  lesson: "lesson",
});

export const sentences = table("sentences", {
  id: "id",
  japanese: "japanese",
  chinese: "chinese",
  source: "source",
  jlpt_level: "jlpt_level",
});

export const wordSentences = table("word_sentences", {
  word_id: "word_id",
  sentence_id: "sentence_id",
});

export const userProgress = table("user_progress", {
  id: "id",
  word_id: "word_id",
  quiz_mode: "quiz_mode",
  correct_count: "correct_count",
  wrong_count: "wrong_count",
  last_reviewed_at: "last_reviewed_at",
  next_review_at: "next_review_at",
});

export const settings = table("settings", {
  key: "key",
  value: "value",
});

// ---- Drizzle-compatible operators ----
type Condition =
  | { column: string; op: "eq"; value: any }
  | { column: string; op: "ne"; value: any }
  | { column: string; op: "in"; values: any[] }
  | { op: "and"; conditions: Condition[] };

export function eq(column: string, value: any): Condition {
  return { column, op: "eq", value };
}

export function ne(column: string, value: any): Condition {
  return { column, op: "ne", value };
}

export function and(...conditions: Condition[]): Condition {
  return { op: "and", conditions };
}

export function inArray(column: string, values: any[]): Condition {
  return { column, op: "in", values };
}

export function sql(): string {
  return "";
}

// ---- In-memory data store ----
let wordsData: any[] = [];
let sentencesData: any[] = [];
let wsData: any[] = [];
let progressData: any[] = [];
let settingsMap: Map<string, string> = new Map();
let progressId = 1;

function filterRows(rows: any[], cond: Condition): any[] {
  if (!cond) return rows;

  if (cond.op === "eq") {
    return rows.filter((r) => r[cond.column] === cond.value);
  }
  if (cond.op === "ne") {
    return rows.filter((r) => r[cond.column] !== cond.value);
  }
  if (cond.op === "in") {
    return rows.filter((r) => cond.values.includes(r[cond.column]));
  }
  if (cond.op === "and") {
    let result = rows;
    for (const c of cond.conditions) {
      result = filterRows(result, c);
    }
    return result;
  }
  return rows;
}

function getTableName(tableRef: any): string {
  if (typeof tableRef === "string") return tableRef;
  if (tableRef._table) return tableRef._table;
  return "unknown";
}

function getTableData(name: string): any[] {
  switch (name) {
    case "words": return wordsData;
    case "sentences": return sentencesData;
    case "word_sentences": return wsData;
    case "user_progress": return progressData;
    case "settings": return [...settingsMap.entries()].map(([k, v]) => ({ key: k, value: v }));
    default: return [];
  }
}

// ---- Query builder (mimics Drizzle chain) ----
function createBuilder() {
  let _table: string = "";
  let _where: Condition | undefined;
  let _limit: number | undefined;
  let _columns: Record<string, any> | undefined;
  let _isDistinct = false;

  const builder: any = {
    select: (cols?: any) => {
      _columns = cols;
      _isDistinct = false;
      return builder;
    },
    selectDistinct: (cols: any) => {
      _columns = cols;
      _isDistinct = true;
      return builder;
    },
    from: (tableRef: any) => {
      _table = getTableName(tableRef);
      return builder;
    },
    where: (cond: Condition) => {
      _where = cond;
      return builder;
    },
    limit: (n: number) => {
      _limit = n;
      return builder;
    },
    all: (): any[] => {
      let rows = [...getTableData(_table)];
      if (_where) rows = filterRows(rows, _where);
      if (_limit) rows = rows.slice(0, _limit);
      if (_columns && !_isDistinct) {
        const keys = Object.values(_columns);
        rows = rows.map((r) => {
          const obj: any = {};
          for (const k of keys) obj[k as string] = r[k as string];
          return obj;
        });
      }
      if (_isDistinct && _columns) {
        const keys = Object.values(_columns);
        const seen = new Set();
        rows = rows.filter((r) => {
          const sig = keys.map((k: any) => r[k]).join("|");
          if (seen.has(sig)) return false;
          seen.add(sig);
          return true;
        });
      }
      return rows;
    },
    insert: (tableRef: any) => ({
      values: (data: any) => ({
        onConflictDoUpdate: (_opts: any) => ({
          set: () => ({ run: () => {} }),
          run: () => {},
        }),
        run: () => {
          const t = getTableName(tableRef);
          if (t === "user_progress") {
            data.id = progressId++;
            progressData.push(data);
          } else if (t === "settings") {
            settingsMap.set(data.key, data.value);
          } else if (t === "words") {
            wordsData.push(data);
          } else if (t === "sentences") {
            sentencesData.push(data);
          } else if (t === "word_sentences") {
            wsData.push(data);
          }
        },
      }),
    }),
    update: (tableRef: any) => ({
      set: (data: any) => ({
        where: (cond: Condition) => ({
          run: () => {
            const t = getTableName(tableRef);
            if (t === "user_progress") {
              const matches = filterRows([...progressData], cond);
              for (const m of matches) {
                const idx = progressData.findIndex((r: any) => r.id === m.id);
                if (idx >= 0) Object.assign(progressData[idx], data);
              }
            }
          },
        }),
      }),
    }),
  };
  return builder;
}

export const webDb = createBuilder();

// ---- Initialize ----
import vocabSeed from "../../assets/seed/vocab.json";
import sentencesSeed from "../../assets/seed/sentences.json";
import wordSentencesSeed from "../../assets/seed/word_sentences.json";

export function initWebDatabase() {
  wordsData = [];
  sentencesData = [];
  wsData = [];
  progressData = [];
  settingsMap = new Map();
  progressId = 1;

  for (const w of vocabSeed) {
    wordsData.push({
      id: w.id,
      japanese: w.japanese,
      reading: w.reading,
      chinese_meaning: w.chinese_meaning,
      part_of_speech: w.part_of_speech ?? null,
      jlpt_level: w.jlpt_level ?? null,
      source: w.source ?? null,
      lesson: w.lesson ?? null,
    });
  }

  for (const s of sentencesSeed) {
    sentencesData.push({
      id: s.id,
      japanese: s.japanese,
      chinese: s.chinese,
      source: s.source ?? null,
      jlpt_level: s.jlpt_level ?? null,
    });
  }

  for (const ws of wordSentencesSeed) {
    wsData.push({ word_id: ws.word_id, sentence_id: ws.sentence_id });
  }

  console.log(`[WebDB] Loaded ${wordsData.length} words, ${sentencesData.length} sentences`);
}

export function isWebPlatform() {
  return Platform.OS === "web";
}
