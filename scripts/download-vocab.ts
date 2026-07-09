/**
 * Downloads and processes JLPT vocabulary data from AnchorI/jlpt-kanji-dictionary.
 *
 * Usage: npx ts-node scripts/download-vocab.ts
 *
 * This script fetches the comprehensive JLPT vocabulary JSON from GitHub
 * and transforms it into the format used by the app's seed data.
 */

import * as fs from "fs";
import * as path from "path";

const SOURCE_URL =
  "https://raw.githubusercontent.com/AnchorI/jlpt-kanji-dictionary/main/dictionary.json";

interface JlptEntry {
  kanji: string;
  reading: string;
  pos: string;
  glossary_en: string[];
  glossary_ru?: string[];
  sequence: number;
}

interface WordSeed {
  id: number;
  japanese: string;
  reading: string;
  chinese_meaning: string;
  part_of_speech: string | null;
  jlpt_level: number | null;
  source: string;
  lesson: number | null;
}

// JLPT level mapping based on word frequency/sequence
// Approximate: first ~800 = N5, ~800-1500 = N4, etc.
function estimateJlptLevel(sequence: number): number | null {
  if (sequence <= 800) return 5;
  if (sequence <= 1500) return 4;
  if (sequence <= 3000) return 3;
  if (sequence <= 5000) return 2;
  if (sequence <= 10000) return 1;
  return null;
}

async function main() {
  console.log("Downloading vocabulary data...");
  const response = await fetch(SOURCE_URL);
  const data: JlptEntry[] = await response.json();

  console.log(`Processing ${data.length} entries...`);

  const words: WordSeed[] = [];
  let id = 1;

  for (const entry of data) {
    if (!entry.kanji || !entry.reading || !entry.glossary_en?.length) continue;

    // Use first English glossary entry as Chinese meaning
    // (the dataset has English, not Chinese - for Chinese get from alternative source)
    const meaning = entry.glossary_en[0];
    const jlptLevel = estimateJlptLevel(entry.sequence);

    words.push({
      id: id++,
      japanese: entry.kanji,
      reading: entry.reading,
      chinese_meaning: meaning,
      part_of_speech: entry.pos || null,
      jlpt_level: jlptLevel,
      source: "jlpt",
      lesson: null,
    });
  }

  const outPath = path.join(__dirname, "..", "assets", "seed", "vocab_downloaded.json");
  fs.writeFileSync(outPath, JSON.stringify(words, null, 2), "utf-8");
  console.log(`Written ${words.length} words to ${outPath}`);
}

main().catch(console.error);
