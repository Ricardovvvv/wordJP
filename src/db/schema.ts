import { sqliteTable, integer, text, primaryKey } from "drizzle-orm/sqlite-core";

export const words = sqliteTable("words", {
  id: integer("id").primaryKey(),
  japanese: text("japanese").notNull(),
  reading: text("reading").notNull(),
  chinese_meaning: text("chinese_meaning").notNull(),
  part_of_speech: text("part_of_speech"),
  jlpt_level: integer("jlpt_level"),
  source: text("source"),
  lesson: integer("lesson"),
});

export const sentences = sqliteTable("sentences", {
  id: integer("id").primaryKey(),
  japanese: text("japanese").notNull(),
  chinese: text("chinese").notNull(),
  source: text("source"),
  jlpt_level: integer("jlpt_level"),
});

export const wordSentences = sqliteTable(
  "word_sentences",
  {
    word_id: integer("word_id").references(() => words.id),
    sentence_id: integer("sentence_id").references(() => sentences.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.word_id, t.sentence_id] }),
  })
);

export const userProgress = sqliteTable("user_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  word_id: integer("word_id").references(() => words.id),
  quiz_mode: integer("quiz_mode").notNull(),
  correct_count: integer("correct_count").default(0),
  wrong_count: integer("wrong_count").default(0),
  last_reviewed_at: text("last_reviewed_at"),
  next_review_at: text("next_review_at"),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});
