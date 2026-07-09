/**
 * Downloads and processes JLPT vocabulary from
 * firavoyage/_anki-jlpt-decks (NEW-JLPT).
 *
 * This dataset has:
 * - JLPT N5-N1 vocabulary with readings
 * - Chinese translations (simplified + traditional)
 * - Example sentences with Chinese translations
 * - Audio file references
 *
 * Run: npx tsx scripts/build-seed.ts
 */
import * as fs from "fs";
import * as path from "path";

const CSV_URL =
  "https://raw.githubusercontent.com/firavoyage/_anki-jlpt-decks/main/NEW-JLPT/notes.csv";

// Level mapping from deck name
function extractLevel(deck: string): number | null {
  if (deck.includes("N5")) return 5;
  if (deck.includes("N4")) return 4;
  if (deck.includes("N3")) return 3;
  if (deck.includes("N2")) return 2;
  if (deck.includes("N1")) return 1;
  return null;
}

// Map Anki POS to our simplified POS
function mapPos(pos: string): string | null {
  if (!pos) return null;
  const p = pos.trim();
  if (p.includes("名") || p === "n" || p === "noun") return "noun";
  if (p.includes("動") || p === "v" || p === "verb") return "verb";
  if (p.includes("イ形") || p.includes("い形") || p === "adj-i") return "adj-i";
  if (p.includes("ナ形") || p.includes("な形") || p === "adj-na") return "adj-na";
  if (p.includes("副") || p === "adv") return "adv";
  if (p.includes("接尾")) return "suffix";
  if (p.includes("接頭")) return "prefix";
  if (p.includes("代") || p.includes("pron")) return "pronoun";
  if (p.includes("連体")) return "pre-noun";
  if (p.includes("接続") || p === "conj") return "conjunction";
  if (p.includes("感動") || p === "int") return "interjection";
  if (p.includes("助詞")) return "particle";
  if (p.includes("助動")) return "aux-verb";
  if (p.includes("数")) return "number";
  return p.substring(0, 20);
}

// Clean HTML tags from text
function cleanHtml(text: string): string {
  return text
    .replace(/<b>/g, "")
    .replace(/<\/b>/g, "")
    .replace(/<br\s*\/?>/g, "")
    .replace(/\[sound:[^\]]+\]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// Simple CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  console.log("Downloading CSV...");
  const resp = await fetch(CSV_URL);
  const text = await resp.text();
  const lines = text.split("\n");
  console.log(`Downloaded ${lines.length} lines`);

  const words: any[] = [];
  const sentences: any[] = [];
  const wordSentenceLinks: { word_id: number; sentence_id: number }[] = [];
  let wordId = 1;
  let sentenceId = 1;
  const seenWords = new Set<string>();
  const seenSentences = new Set<string>();
  const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // Skip header lines
  const dataStart = lines.findIndex((l) => l.startsWith("NEW-JLPT"));
  if (dataStart < 0) {
    console.log("Could not find data start in CSV");
    process.exit(1);
  }

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const cols = parseCSVLine(line);
      if (cols.length < 10) continue;

      const deck = cols[0] || "";
      const level = extractLevel(deck);
      if (!level) continue; // skip if no JLPT level detected

      const japanese = cleanHtml(cols[2] || "");
      const pos = cols[4] || "";
      const reading = cleanHtml(cols[5] || "");
      const meaningCN = cols[6] || cols[7] || ""; // simplified or traditional
      const sentenceJP = cleanHtml(cols[11] || "");
      const sentenceCN = cols[13] || cols[14] || ""; // simplified or traditional

      // Skip if missing essential data
      if (!japanese || !reading || !meaningCN) continue;

      const wordKey = `${japanese}|${reading}`;
      if (!seenWords.has(wordKey)) {
        seenWords.add(wordKey);
        levelCounts[level] = (levelCounts[level] || 0) + 1;

        words.push({
          id: wordId,
          japanese,
          reading,
          chinese_meaning: meaningCN,
          part_of_speech: mapPos(pos),
          jlpt_level: level,
          source: "jlpt",
          lesson: null,
        });

        // Add sentence if available
        if (sentenceJP && sentenceCN) {
          const sentKey = sentenceJP;
          if (!seenSentences.has(sentKey)) {
            seenSentences.add(sentKey);
            sentences.push({
              id: sentenceId,
              japanese: sentenceJP,
              chinese: sentenceCN,
              source: "jlpt-anki",
              jlpt_level: level,
            });
            sentenceId++;
          }

          // Link word to sentence (find the sentence ID)
          const sId = sentences.find((s) => s.japanese === sentenceJP)?.id;
          if (sId) {
            wordSentenceLinks.push({ word_id: wordId, sentence_id: sId });
          }
        }

        wordId++;
      }
    } catch {
      // Skip malformed lines
    }
  }

  const outDir = path.join(__dirname, "..", "assets", "seed");

  fs.writeFileSync(path.join(outDir, "vocab.json"), JSON.stringify(words, null, 2));
  fs.writeFileSync(path.join(outDir, "sentences.json"), JSON.stringify(sentences, null, 2));
  fs.writeFileSync(path.join(outDir, "word_sentences.json"), JSON.stringify(wordSentenceLinks, null, 2));

  console.log(`\nGenerated:`);
  console.log(`  Words: ${words.length} total`);
  for (const lv of [5, 4, 3, 2, 1]) {
    console.log(`    N${lv}: ${levelCounts[lv]}`);
  }
  console.log(`  Sentences: ${sentences.length}`);
  console.log(`  Word-Sentence links: ${wordSentenceLinks.length}`);
  console.log(`\nFiles written to ${outDir}/`);
}

main().catch((e) => {
  console.error("Build failed:", e.message);
  process.exit(1);
});
