import { Platform } from "react-native";

// ---- Web branch ----
import {
  words as webWords,
  sentences as webSentences,
  wordSentences as webWS,
  userProgress as webProgress,
  settings as webSettings,
  eq as webEq,
  ne as webNe,
  and as webAnd,
  inArray as webInArray,
  sql as webSql,
  webDb,
  isWebPlatform,
  initWebDatabase,
} from "./web-db";

const IS_WEB = isWebPlatform();

// Re-export schema objects and operators
export const words = IS_WEB ? webWords : require("./schema").words;
export const sentences = IS_WEB ? webSentences : require("./schema").sentences;
export const wordSentences = IS_WEB ? webWS : require("./schema").wordSentences;
export const userProgress = IS_WEB ? webProgress : require("./schema").userProgress;
export const settings = IS_WEB ? webSettings : require("./schema").settings;

export const eq = IS_WEB ? webEq : require("drizzle-orm").eq;
export const ne = IS_WEB ? webNe : require("drizzle-orm").ne;
export const and = IS_WEB ? webAnd : require("drizzle-orm").and;
export const inArray = IS_WEB ? webInArray : require("drizzle-orm").inArray;
export const sql = IS_WEB ? webSql : require("drizzle-orm").sql;

// ---- Database getter ----
let _nativeDb: any = null;

export function getDatabase(): { db: any; sqlite: any } {
  if (IS_WEB) {
    return { db: webDb, sqlite: null };
  }

  if (!_nativeDb) {
    const expoSqlite = require("expo-sqlite");
    const drizzle = require("drizzle-orm/expo-sqlite").drizzle;
    const schema = require("./schema");
    const sqlite = expoSqlite.openDatabaseSync("wordjp.db");
    _nativeDb = { db: drizzle(sqlite, { schema }), sqlite };
  }
  return _nativeDb;
}

// ---- Initialization ----
export async function initializeDatabase() {
  if (IS_WEB) {
    initWebDatabase();
    return;
  }

  const expoSqlite = require("expo-sqlite");
  const sqlite = expoSqlite.openDatabaseSync("wordjp.db");
  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY,
      japanese TEXT NOT NULL,
      reading TEXT NOT NULL,
      chinese_meaning TEXT NOT NULL,
      part_of_speech TEXT,
      jlpt_level INTEGER,
      source TEXT,
      lesson INTEGER
    );
    CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY,
      japanese TEXT NOT NULL,
      chinese TEXT NOT NULL,
      source TEXT,
      jlpt_level INTEGER
    );
    CREATE TABLE IF NOT EXISTS word_sentences (
      word_id INTEGER REFERENCES words(id),
      sentence_id INTEGER REFERENCES sentences(id),
      PRIMARY KEY (word_id, sentence_id)
    );
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER REFERENCES words(id),
      quiz_mode INTEGER NOT NULL,
      correct_count INTEGER DEFAULT 0,
      wrong_count INTEGER DEFAULT 0,
      last_reviewed_at TEXT,
      next_review_at TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
