import { Platform } from "react-native";

const vocabData = require("../../assets/seed/vocab.json");
const sentencesData = require("../../assets/seed/sentences.json");
const wordSentencesData = require("../../assets/seed/word_sentences.json");

export async function seedDatabase(): Promise<void> {
  // Web uses initWebDatabase() which is called from initializeDatabase()
  if (Platform.OS === "web") return;

  // Native SQLite seed
  const { getDatabase } = require("./client");
  const { words, sentences, wordSentences } = require("./schema");
  const { db } = getDatabase();

  const existing = db.select().from(words).limit(1).all();
  if (existing.length > 0) return;

  for (const word of vocabData) {
    db.insert(words).values({
      id: word.id,
      japanese: word.japanese,
      reading: word.reading,
      chinese_meaning: word.chinese_meaning,
      part_of_speech: word.part_of_speech ?? null,
      jlpt_level: word.jlpt_level ?? null,
      source: word.source ?? null,
      lesson: word.lesson ?? null,
    }).run();
  }

  for (const sentence of sentencesData) {
    db.insert(sentences).values({
      id: sentence.id,
      japanese: sentence.japanese,
      chinese: sentence.chinese,
      source: sentence.source ?? null,
      jlpt_level: sentence.jlpt_level ?? null,
    }).run();
  }

  for (const ws of wordSentencesData) {
    db.insert(wordSentences).values({
      word_id: ws.word_id,
      sentence_id: ws.sentence_id,
    }).run();
  }

  console.log(`Seeded: ${vocabData.length} words, ${sentencesData.length} sentences`);
}
