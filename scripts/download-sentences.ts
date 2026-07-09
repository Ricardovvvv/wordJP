/**
 * Downloads and processes Japanese example sentences from the Tanaka Corpus
 * (hosted on Hugging Face).
 *
 * Usage: npx ts-node scripts/download-sentences.ts
 */

import * as fs from "fs";
import * as path from "path";

// Tanaka Corpus on Hugging Face (JP-EN sentence pairs)
const SOURCE_URL =
  "https://huggingface.co/datasets/Hoshikuzu/Tanaka-corpus/resolve/main/data/train.json";

interface TanakaEntry {
  ja: string;
  en: string;
}

interface SentenceSeed {
  id: number;
  japanese: string;
  chinese: string;
  source: string;
  jlpt_level: number | null;
}

// Simple heuristic: estimate JLPT level from sentence length
function estimateLevel(ja: string): number | null {
  const len = ja.length;
  if (len <= 10) return 5;
  if (len <= 20) return 4;
  if (len <= 35) return 3;
  if (len <= 50) return 2;
  return 1;
}

async function main() {
  console.log("Downloading Tanaka Corpus sentences...");
  const response = await fetch(SOURCE_URL);
  const data: TanakaEntry[] = await response.json();

  console.log(`Processing ${data.length} sentences...`);

  const sentences: SentenceSeed[] = [];
  const maxSentences = 500; // Limit to avoid huge seed file

  for (let i = 0; i < Math.min(data.length, maxSentences); i++) {
    const entry = data[i];
    if (!entry.ja || !entry.en) continue;

    sentences.push({
      id: i + 1,
      japanese: entry.ja,
      chinese: entry.en, // Note: these are English, not Chinese
      source: "tanaka",
      jlpt_level: estimateLevel(entry.ja),
    });
  }

  const outPath = path.join(__dirname, "..", "assets", "seed", "sentences_downloaded.json");
  fs.writeFileSync(outPath, JSON.stringify(sentences, null, 2), "utf-8");
  console.log(`Written ${sentences.length} sentences to ${outPath}`);
  console.log("Note: sentences use English translations. Use Tatoeba for Chinese translations.");
}

main().catch(console.error);
