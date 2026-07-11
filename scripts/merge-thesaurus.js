/**
 * Merge lxl66566/Japanese-Chinese-thesaurus into our vocabulary.
 * Run: node scripts/merge-thesaurus.js
 */
const fs = require("fs");

const thesaurus = JSON.parse(fs.readFileSync("assets/seed/thesaurus.json", "utf-8"));
const ourVocab = JSON.parse(fs.readFileSync("assets/seed/vocab.json", "utf-8"));

const ourKeys = new Set();
ourVocab.forEach((w) => ourKeys.add(w.japanese));

function parseEntry(jpKey, raw) {
  let reading = "";
  let meaning = raw;
  // Format: "(かんじ0) 中文意思" or "(かんじ) 中文"
  const m = raw.match(/^\((.+?)(\d*)\)\s*(.*)/);
  if (m) {
    reading = m[1].replace(/\d/g, "");
    meaning = m[3] || "";
  }
  if (!meaning.trim()) meaning = raw;
  const jp = jpKey.replace(/[\[\]]/g, "").trim();
  return { japanese: jp, reading: reading || jp, meaning: meaning.trim() };
}

let newWords = 0, skipped = 0, overlap = 0;
const toAdd = [];
let maxId = ourVocab.reduce((max, w) => Math.max(max, w.id), 0);

for (const [k, v] of Object.entries(thesaurus)) {
  if (typeof v !== "string") continue;
  // Skip grammar patterns
  if (/[～~（）()【】]/.test(k)) { skipped++; continue; }
  const parsed = parseEntry(k, v);
  if (!parsed.japanese || parsed.japanese.length === 0) continue;
  if (!parsed.meaning || parsed.meaning.length < 2) continue;
  // Skip very long grammar explanations
  if (parsed.meaning.length > 200) { skipped++; continue; }

  if (!ourKeys.has(parsed.japanese)) {
    maxId++;
    toAdd.push({
      id: maxId, japanese: parsed.japanese, reading: parsed.reading,
      chinese_meaning: parsed.meaning, part_of_speech: null,
      jlpt_level: null, source: "thesaurus", lesson: null,
    });
    newWords++;
  } else {
    overlap++;
  }
}

console.log("New:", newWords, "Overlap:", overlap, "Skipped:", skipped);
const all = [...ourVocab, ...toAdd];
all.forEach((w, i) => (w.id = i + 1));
fs.writeFileSync("assets/seed/vocab.json", JSON.stringify(all, null, 2));

const bySrc = {};
all.forEach((w) => {
  w.source.split(",").forEach((t) => { bySrc[t] = (bySrc[t] || 0) + 1; });
});
console.log("\nBy source:");
Object.entries(bySrc).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log("  " + k + ": " + v));
console.log("Total:", all.length);
fs.unlinkSync("assets/seed/thesaurus.json");
console.log("Done!");
