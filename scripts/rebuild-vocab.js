/**
 * Rebuild vocabulary database — de-duplicate via (japanese, reading) key,
 * tag-based source tracking, prefer textbook lesson numbers over JLPT nulls.
 *
 * Books: JLPT / Minna no Nihongo / Standard JP / Genki
 *
 * Run: node scripts/rebuild-vocab.js
 */
const fs = require("fs");
const SEED = "assets/seed";

// ---- Helpers ----
function mkKey(w) { return w.japanese + "|" + w.reading; }
function hasChinese(s) { return /[一-鿿]/.test(s || ""); }

// ---- 1. Load existing ----
const words = JSON.parse(fs.readFileSync(`${SEED}/vocab.json`, "utf-8"));
const sentences = JSON.parse(fs.readFileSync(`${SEED}/sentences.json`, "utf-8"));
console.log("Existing words:", words.length, "| sentences:", sentences.length);

// ---- 2. Build merge map ----
const mergeMap = new Map();

function mergeWord(w, tag) {
  if (!w.japanese || !w.reading) return;
  if (!hasChinese(w.chinese_meaning)) return; // skip English-only
  const k = mkKey(w);
  if (mergeMap.has(k)) {
    const existing = mergeMap.get(k);
    existing.tags.add(tag);
    // Prefer textbook lesson numbers
    if (w.lesson != null && existing.lesson == null) {
      existing.lesson = w.lesson;
    }
    // Prefer Chinese meaning
    if (!hasChinese(existing.chinese_meaning) && hasChinese(w.chinese_meaning)) {
      existing.chinese_meaning = w.chinese_meaning;
    }
  } else {
    mergeMap.set(k, {
      japanese: w.japanese,
      reading: w.reading,
      chinese_meaning: w.chinese_meaning,
      part_of_speech: w.part_of_speech || null,
      jlpt_level: w.jlpt_level || null,
      tags: new Set([tag]),
      lesson: w.lesson || null,
    });
  }
}

// ---- 2a. Load existing words into mergeMap ----
for (const w of words) {
  const tags = new Set((w.source || "").split(",").filter(Boolean));
  mergeMap.set(mkKey(w), {
    japanese: w.japanese,
    reading: w.reading,
    chinese_meaning: w.chinese_meaning,
    part_of_speech: w.part_of_speech || null,
    jlpt_level: w.jlpt_level || null,
    tags,
    lesson: w.lesson || null,
  });
}

// ---- 2b. Parse Minna YAML ----
{
  const yaml = fs.readFileSync(`${SEED}/minna.yaml`, "utf-8");
  const lines = yaml.split("\n");
  let lesson = 0, kanji = null, kana = "", meaning = "";

  function emit() {
    if (!kana) return;
    const jp = kanji || kana;
    mergeWord({ japanese: jp, reading: kana, chinese_meaning: meaning, part_of_speech: null, jlpt_level: null, lesson }, "minna_no_nihongo");
    kanji = null; kana = ""; meaning = "";
  }

  for (const l of lines) {
    const t = l.trim();
    const lm = t.match(/^lesson-(\d+):/);
    if (lm) { emit(); lesson = parseInt(lm[1]); continue; }
    if (t.startsWith("- id:")) { emit(); continue; }
    if (t.startsWith("kanji:")) kanji = (t.substring(7).replace(/"/g, "").trim() === "~" ? null : t.substring(7).replace(/"/g, "").trim()) || null;
    else if (t.startsWith("kana:")) kana = t.substring(6).replace(/"/g, "").trim();
    else if (t.includes("en:")) { const m = t.match(/en:\s*"(.+?)"/); if (m) meaning = m[1]; }
  }
  emit();
}

// ---- 2c. Parse Genki CSV ----
{
  const csv = fs.readFileSync(`${SEED}/genki1.csv`, "utf-8");
  for (const l of csv.split("\n")) {
    const cols = l.split(",");
    if (cols.length < 4) continue;
    const jap = (cols[0] || "").trim();
    const reading = (cols[1] || "").trim();
    const meaning = (cols[2] || "").trim();
    const lesson = parseInt(cols[3]) || 1;
    if (!jap || !meaning) continue;
    mergeWord({ japanese: jap, reading: reading || jap, chinese_meaning: meaning, part_of_speech: null, jlpt_level: null, lesson }, "genki");
  }
}

// ---- 3. Write output ----
const out = [];
let id = 1;
for (const [k, w] of mergeMap) {
  out.push({
    id: id++,
    japanese: w.japanese,
    reading: w.reading,
    chinese_meaning: w.chinese_meaning,
    part_of_speech: w.part_of_speech,
    jlpt_level: w.jlpt_level,
    source: [...w.tags].join(","),
    lesson: w.lesson,
  });
}
fs.writeFileSync(`${SEED}/vocab.json`, JSON.stringify(out, null, 2));

// ---- 4. Rebuild word_sentence links ----
const newIdMap = new Map();
out.forEach((w) => newIdMap.set(mkKey(w), w.id));

const seen = new Set();
const newLinks = [];

// Re-link existing WS
const oldLinks = JSON.parse(fs.readFileSync(`${SEED}/word_sentences.json`, "utf-8"));
for (const l of oldLinks) {
  const ow = words.find((w) => w.id === l.word_id);
  if (!ow) continue;
  const nid = newIdMap.get(mkKey(ow));
  if (!nid) continue;
  const lk = nid + "|" + l.sentence_id;
  if (seen.has(lk)) continue;
  seen.add(lk);
  newLinks.push({ word_id: nid, sentence_id: l.sentence_id });
}

// Add new links via text matching
for (const w of out) {
  const clean = w.japanese.replace(/^[〜～]/, "");
  if (clean.length < 1) continue;
  for (const s of sentences) {
    if (s.japanese.includes(clean)) {
      const lk = w.id + "|" + s.id;
      if (!seen.has(lk)) { seen.add(lk); newLinks.push({ word_id: w.id, sentence_id: s.id }); }
    }
  }
}

fs.writeFileSync(`${SEED}/word_sentences.json`, JSON.stringify(newLinks, null, 2));

// ---- Stats ----
const byTag = {};
out.forEach((w) => w.source.split(",").forEach((t) => (byTag[t] = (byTag[t] || 0) + 1)));

console.log("\n=== RESULTS ===");
console.log("Total unique words:", out.length);
Object.entries(byTag).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
console.log("Sentences:", sentences.length);
console.log("Word-Sentence links:", newLinks.length);

// Lesson ranges
for (const tag of ["minna_no_nihongo", "genki", "standard_jp"]) {
  const ws = out.filter((w) => w.source.includes(tag));
  const lessons = ws.map((w) => w.lesson).filter(Boolean);
  const uniqueLessons = new Set(lessons);
  console.log(`${tag}: ${ws.length} words, ${uniqueLessons.size} unique lessons, lesson range: ${lessons.length ? Math.min(...lessons) + "-" + Math.max(...lessons) : "N/A"}`);
}

// Overlap
const multi = out.filter((w) => w.source.includes(","));
console.log("Multi-tag words:", multi.length);

// Cleanup
try { fs.unlinkSync(`${SEED}/minna.yaml`); } catch {}
try { fs.unlinkSync(`${SEED}/genki1.csv`); } catch {}
console.log("\nDone!");
