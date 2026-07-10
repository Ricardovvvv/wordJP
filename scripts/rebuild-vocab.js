/**
 * Rebuild vocabulary database with tag-based deduplication.
 *
 * Each unique (japanese, reading) pair gets a single entry
 * with source_tags containing all textbooks it appears in.
 *
 * Run: node scripts/rebuild-vocab.js
 */
const fs = require("fs");
const path = require("path");

const SEED = "assets/seed";

// ---- Load data sources ----
const existingVocab = JSON.parse(fs.readFileSync(`${SEED}/vocab.json`, "utf-8"));
const existingSent = JSON.parse(fs.readFileSync(`${SEED}/sentences.json`, "utf-8"));
const existingWS = JSON.parse(fs.readFileSync(`${SEED}/word_sentences.json`, "utf-8"));
const biaoriRaw = JSON.parse(fs.readFileSync(`${SEED}/biaori_full.json`, "utf-8"));

console.log("Existing vocab:", existingVocab.length);
console.log("Existing sentences:", existingSent.length);
console.log("Biaori entries:", biaoriRaw.length);

// ---- Parse biaori reading/japanese format ----
function parseJp(str) {
  if (!str) return { reading: "", japanese: "" };
  const m = str.match(/^(.+?)\((.+)\)$/);
  if (m) return { reading: m[1], japanese: m[2] };
  return { reading: str, japanese: str };
}

// ---- Map biaori lesson to book and level ----
// Standard numbering: 0=入门, 1-24=初上, 104+=encoding, etc.
// Map all to textbook volumes
function classifyBiaoriLesson(lesson) {
  if (lesson >= 20000) return { book: "高级", volume: "词汇补充" };
  if (lesson >= 416) return { book: "高级", volume: "上·下册" };
  if (lesson >= 312) return { book: "中级", volume: "下册" };
  if (lesson >= 208) return { book: "中级", volume: "上册" };
  if (lesson >= 104) return { book: "初级", volume: "下册" };
  if (lesson >= 1) return { book: "初级", volume: "上册" };
  return { book: "初级", volume: "入门单元" };
}

// ---- Build biaori words with source tags ----
const biaoriMap = new Map(); // key: "japanese|reading" -> {tags, lesson, pos, meaning}

for (const entry of biaoriRaw) {
  if (!entry || !Array.isArray(entry) || entry.length < 4) continue;

  const lessonNum = entry[0];
  const posRaw = (entry[1] || "").replace(/[\[\]]/g, "").trim();
  const meaning = (entry[2] || "").trim();
  const jpRaw = (entry[3] || "").trim();

  if (!meaning || !jpRaw) continue;

  const { reading, japanese } = parseJp(jpRaw);
  if (!japanese || !reading) continue;
  if (japanese.includes("（") || reading.includes("）")) continue; // skip parse failures

  const key = japanese + "|" + reading;
  const classification = classifyBiaoriLesson(lessonNum);

  if (!biaoriMap.has(key)) {
    biaoriMap.set(key, {
      japanese,
      reading,
      meaning,
      pos: posRaw || null,
      sourceTags: new Set(["standard_jp"]),
      lessonTag: `标准日本语·${classification.book}${classification.volume}·第${lessonNum}课`,
    });
  } else {
    // Merge: use the longer/better meaning
    const existing = biaoriMap.get(key);
    if (meaning.length > existing.meaning.length) {
      existing.meaning = meaning;
    }
    existing.sourceTags.add("standard_jp");
  }
}

console.log("Unique biaori words:", biaoriMap.size);

// ---- Build merged vocabulary with tags ----
const mergedMap = new Map();
const keyToId = new Map();

// First pass: existing vocab
for (const w of existingVocab) {
  const key = w.japanese + "|" + w.reading;
  const tags = new Set((w.source || "").split(",").filter(Boolean));

  if (!mergedMap.has(key)) {
    mergedMap.set(key, {
      japanese: w.japanese,
      reading: w.reading,
      chinese_meaning: w.chinese_meaning,
      part_of_speech: w.part_of_speech,
      jlpt_level: w.jlpt_level,
      tags,
      lesson: w.lesson || null,
    });
  } else {
    const existing = mergedMap.get(key);
    w.source.split(",").forEach(t => existing.tags.add(t));
    if (w.jlpt_level && !existing.jlpt_level) existing.jlpt_level = w.jlpt_level;
  }
}

// Second pass: merge biaori words
for (const [key, bw] of biaoriMap) {
  if (mergedMap.has(key)) {
    const existing = mergedMap.get(key);
    bw.sourceTags.forEach(t => existing.tags.add(t));
    // Use Chinese meaning if the existing one is English
    if (existing.chinese_meaning &&
        /^[a-zA-Z\s/.()]+$/.test(existing.chinese_meaning) &&
        /[一-鿿]/.test(bw.meaning)) {
      existing.chinese_meaning = bw.meaning;
    }
  } else {
    mergedMap.set(key, {
      japanese: bw.japanese,
      reading: bw.reading,
      chinese_meaning: bw.meaning,
      part_of_speech: bw.pos,
      jlpt_level: null,
      tags: bw.sourceTags,
      lesson: bw.lessonTag,
    });
  }
}

// ---- Write output ----
const allWords = [];
let id = 1;
for (const [key, w] of mergedMap) {
  const tagStr = [...w.tags].join(",");
  allWords.push({
    id: id,
    japanese: w.japanese,
    reading: w.reading,
    chinese_meaning: w.chinese_meaning,
    part_of_speech: w.part_of_speech || null,
    jlpt_level: w.jlpt_level,
    source: tagStr,
    lesson: w.lesson,
  });
  keyToId.set(key, id);
  id++;
}

// Sort: JLPT first, then minna, then standard_jp
const tagOrder = { jlpt: 0, minna_no_nihongo: 1, standard_jp: 2 };
allWords.sort((a, b) => {
  const aFirst = a.source.split(",")[0];
  const bFirst = b.source.split(",")[0];
  return (tagOrder[aFirst] || 9) - (tagOrder[bFirst] || 9);
});
allWords.forEach((w, i) => {
  w.id = i + 1;
  keyToId.set(w.japanese + "|" + w.reading, w.id);
});

// Rebuild sentences (keep existing + add for biaori words that need them)
const seenSent = new Set(existingSent.map(s => s.japanese));
const allSentences = [...existingSent];
let sid = allSentences.length + 1;

// Add example sentences for standard_jp tagged words that don't have any
const stdJPWords = allWords.filter(w => w.source.includes("standard_jp"));
for (const w of stdJPWords.slice(0, 1500)) {
  const sentJP = `${w.japanese}を覚えましょう。`;
  if (seenSent.has(sentJP)) continue;
  seenSent.add(sentJP);
  allSentences.push({
    id: sid,
    japanese: sentJP,
    chinese: `记住「${w.chinese_meaning}」吧。`,
    source: "standard_jp",
    jlpt_level: w.jlpt_level,
  });
  sid++;
}

// Rebuild word-sentence links
const allWS = [...existingWS];
// Link new sentences to their words
for (let i = 0; i < Math.min(stdJPWords.length, 1500); i++) {
  const w = stdJPWords[i];
  const sentIdx = existingSent.length + i;
  if (sentIdx < allSentences.length) {
    allWS.push({ word_id: w.id, sentence_id: allSentences[sentIdx].id });
  }
}

fs.writeFileSync(`${SEED}/vocab.json`, JSON.stringify(allWords, null, 2));
fs.writeFileSync(`${SEED}/sentences.json`, JSON.stringify(allSentences, null, 2));
fs.writeFileSync(`${SEED}/word_sentences.json`, JSON.stringify(allWS, null, 2));

// ---- Stats ----
const tagCounts = {};
allWords.forEach(w => {
  w.source.split(",").forEach(t => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  });
});

console.log("\n=== Results ===");
console.log("Total unique words:", allWords.length);
console.log("Total sentences:", allSentences.length);
Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});

// Count overlaps
const jlptOnly = allWords.filter(w => w.source === "jlpt").length;
const hasMinna = allWords.filter(w => w.source.includes("minna_no_nihongo")).length;
const hasStdJP = allWords.filter(w => w.source.includes("standard_jp")).length;
const hasBoth = allWords.filter(w => w.source.includes("jlpt") && w.source.includes("minna_no_nihongo")).length;
console.log(`\nJLPT only: ${jlptOnly}`);
console.log(`Has minna: ${hasMinna}`);
console.log(`Has standard_jp: ${hasStdJP}`);
console.log(`JLPT+minna overlap: ${hasBoth}`);

// Clean up temp file
fs.unlinkSync(`${SEED}/biaori_full.json`);
console.log("\nCleaned up temp file. Done!");
