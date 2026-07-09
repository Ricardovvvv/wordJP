/**
 * Merges downloaded vocab and sentence data into the seed format used by the app.
 *
 * Usage:
 *   1. Run download-vocab.ts and download-sentences.ts first
 *   2. Then: npx ts-node scripts/generate-seed.ts
 *
 * This produces ready-to-import JSON files in assets/seed/
 */

import * as fs from "fs";
import * as path from "path";

const SEED_DIR = path.join(__dirname, "..", "assets", "seed");

async function main() {
  // Read downloaded data
  const vocabPath = path.join(SEED_DIR, "vocab_downloaded.json");
  const sentencesPath = path.join(SEED_DIR, "sentences_downloaded.json");

  if (!fs.existsSync(vocabPath)) {
    console.error("vocab_downloaded.json not found. Run download-vocab.ts first.");
    process.exit(1);
  }

  const vocab = JSON.parse(fs.readFileSync(vocabPath, "utf-8"));
  const sentences = fs.existsSync(sentencesPath)
    ? JSON.parse(fs.readFileSync(sentencesPath, "utf-8"))
    : [];

  // Write merged seed files
  fs.writeFileSync(
    path.join(SEED_DIR, "vocab.json"),
    JSON.stringify(vocab, null, 2),
    "utf-8"
  );

  if (sentences.length > 0) {
    fs.writeFileSync(
      path.join(SEED_DIR, "sentences.json"),
      JSON.stringify(sentences, null, 2),
      "utf-8"
    );
  }

  // Generate word-sentence mappings (simple: associate words with sentences
  // by checking if the word appears in the sentence)
  const wordSentenceMap: { word_id: number; sentence_id: number }[] = [];
  for (const word of vocab) {
    for (const sentence of sentences) {
      if (sentence.japanese.includes(word.japanese)) {
        wordSentenceMap.push({ word_id: word.id, sentence_id: sentence.id });
      }
    }
  }

  fs.writeFileSync(
    path.join(SEED_DIR, "word_sentences.json"),
    JSON.stringify(wordSentenceMap, null, 2),
    "utf-8"
  );

  console.log(`Generated seed data:`);
  console.log(`  ${vocab.length} words`);
  console.log(`  ${sentences.length} sentences`);
  console.log(`  ${wordSentenceMap.length} word-sentence mappings`);
}

main().catch(console.error);
