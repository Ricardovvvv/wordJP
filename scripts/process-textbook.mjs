import { readFileSync, writeFileSync } from "fs";

const existingVocab = JSON.parse(readFileSync("assets/seed/vocab.json", "utf-8"));
let maxId = existingVocab.length;
console.log("Existing vocab: " + maxId + " words");

const yaml = readFileSync("assets/seed/minna-no-ds.yaml", "utf-8");
const lines = yaml.split("\n");

const textbookWords = [];
const seen = new Set();
let currentLesson = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Lesson header: lesson-NN:
  const lessonMatch = line.match(/^lesson-(\d+):/);
  if (lessonMatch) {
    currentLesson = parseInt(lessonMatch[1]);
    continue;
  }

  // Only process within a lesson
  if (!currentLesson) continue;

  // Match an entry start: "  - id: [lesson, num]"
  if (!line.match(/^\s+- id:/)) continue;

  // Now scan forward for kanji, kana, meaning
  let kanji = null, kana = null, en = null;
  for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
    const l = lines[j];

    // Stop at next entry or end of lesson
    if (l.match(/^\s+- id:/) || l.match(/^lesson-\d+:/)) break;

    // kanji: ~ or kanji: "xxx"
    if (l.match(/^\s+kanji:\s*~/)) {
      kanji = null;
    } else {
      const km = l.match(/^\s+kanji:\s*"([^"]*)"/);
      if (km) kanji = km[1];
    }

    // kana
    const kam = l.match(/^\s+kana:\s*"([^"]*)"/);
    if (kam) kana = kam[1];

    // en: "xxx", or en: "xxx"
    const em = l.match(/^\s+en:\s*"([^"]*)",?\s*$/);
    if (em) en = em[1];
  }

  if (kana && en) {
    const jp = kanji || kana;
    const key = jp + "|" + kana + "|" + currentLesson;
    if (!seen.has(key)) {
      seen.add(key);
      maxId++;
      textbookWords.push({
        id: maxId,
        japanese: jp,
        reading: kana,
        chinese_meaning: en,
        part_of_speech: null,
        jlpt_level: null,
        source: "minna_no_nihongo",
        lesson: currentLesson,
      });
    }
  }
}

console.log("Textbook words parsed: " + textbookWords.length);
if (textbookWords.length > 0) {
  const withKanji = textbookWords.filter((w) => w.japanese !== w.reading).length;
  console.log("  With kanji: " + withKanji);
  console.log("  Kana only: " + (textbookWords.length - withKanji));

  console.log("Sample:");
  textbookWords.slice(0, 5).forEach((w) =>
    console.log("  L" + w.lesson + ": " + w.japanese + " (" + w.reading + ") = " + w.chinese_meaning)
  );

  const lc = {};
  textbookWords.forEach((w) => { lc[w.lesson] = (lc[w.lesson]||0)+1; });
  const keys = Object.keys(lc).map(Number).sort((a,b)=>a-b);
  console.log("Lessons: " + keys[0] + "-" + keys[keys.length-1] + " (" + keys.length + " total)");
  const b1 = textbookWords.filter(w=>w.lesson<=25).length;
  const b2 = textbookWords.filter(w=>w.lesson>25).length;
  console.log("  Book I (L1-25): " + b1 + " words, Book II (L26-50): " + b2 + " words");
}

// Merge: add textbook words not already in vocab
const allWords = [...existingVocab];
const existingKeys = new Set(allWords.map(w => w.japanese + "|" + w.reading));
let added = 0;
for (const tw of textbookWords) {
  const key = tw.japanese + "|" + tw.reading;
  if (!existingKeys.has(key)) {
    existingKeys.add(key);
    allWords.push(tw);
    added++;
  }
}
allWords.forEach((w, i) => (w.id = i + 1));

writeFileSync("assets/seed/vocab.json", JSON.stringify(allWords, null, 2));
console.log("Final vocab: " + allWords.length + " words (+" + added + " from textbook)");

// Cleanup YAML (already processed)
try { writeFileSync("assets/seed/minna-no-ds.yaml", ""); } catch {}
