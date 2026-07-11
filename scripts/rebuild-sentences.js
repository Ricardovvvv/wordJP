/**
 * Rebuild sentences — category-aware generation.
 * Each word gets 1-2 realistic full Japanese sentences.
 * Run: node scripts/rebuild-sentences.js
 */
const fs = require("fs");
const vocab = JSON.parse(fs.readFileSync("assets/seed/vocab.json", "utf-8"));

// Classify word into semantic category based on Chinese meaning
function classify(word) {
  const m = (word.chinese_meaning || "").toLowerCase();
  // Places
  if (/国|市|町|村|駅|空港|公園|学校|病院|図書館|店|銀行|旅館|ホテル|所|場|館|院/.test(m)) return "place";
  // People
  if (/人|者|先生|学生|友|親|子|兄|弟|姉|妹|夫|婦|家族/.test(m)) return "person";
  // Food/drink
  if (/食|飲|肉|魚|野菜|果物|料理|味|酒|茶|水|飯|パン|米/.test(m)) return "food";
  // Time
  if (/日|月|年|曜|朝|昼|夜|時|分|秒|時間|週|今|昨|明/.test(m)) return "time";
  // Numbers
  if (/[一二三四五六七八九十百千万億]/.test(word.japanese) || /^\d/.test(word.japanese)) return "number";
  // Actions
  if (word.part_of_speech === "verb" || word.part_of_speech?.includes("動") || /(する|ます|る|く|ぐ|ぶ|む|ぬ|う|つ)$/.test(word.japanese)) return "verb";
  // Adjectives
  if (word.part_of_speech === "adj-i" || word.part_of_speech === "adj-na" || /い$/.test(word.japanese)) return "adj";
  // Objects
  if (/本|机|椅子|車|電車|電話|鞄|服|靴|帽子|傘|時計|新聞|写真|地図|辞書|教科書|紙/.test(m)) return "object";
  return "general";
}

const TEMPLATES = {
  place: [
    ["{word}へ行ったことがありますか。", "你去过{word}吗？"],
    ["{word}はとても賑やかな所です。", "{word}是非常热闹的地方。"],
    ["週末に{word}で買い物をしました。", "周末在{word}购物了。"],
    ["{word}まで歩いて十分かかります。", "走路到{word}要十分钟。"],
  ],
  person: [
    ["{word}は私の親友です。", "{word}是我的好朋友。"],
    ["昨日、{word}に会いました。", "昨天见到了{word}。"],
    ["{word}は日本語が上手です。", "{word}的日语很好。"],
    ["{word}と一緒に映画を見ました。", "和{word}一起看了电影。"],
  ],
  food: [
    ["{word}はとても美味しかったです。", "{word}非常好吃。"],
    ["朝ご飯に{word}を食べました。", "早餐吃了{word}。"],
    ["この{word}は日本で人気があります。", "这种{word}在日本很受欢迎。"],
    ["{word}の作り方を教えてください。", "请教我{word}的做法。"],
  ],
  time: [
    ["{word}は何か予定がありますか。", "{word}有什么安排吗？"],
    ["{word}までに宿題を出してください。", "请在{word}之前交作业。"],
    ["{word}から日本語の勉強を始めました。", "从{word}开始学习日语。"],
  ],
  number: [
    ["{word}まで数えてください。", "请教到{word}。"],
    ["答えは{word}です。", "答案是{word}。"],
    ["全部で{word}個あります。", "一共有{word}个。"],
  ],
  verb: [
    ["{word}ことは大切です。", "{word}是很重要的。"],
    ["{word}のを忘れないでください。", "请不要忘记{word}。"],
    ["子供の頃から{word}のが好きでした。", "从小就喜欢{word}。"],
    ["{word}のは難しいですが、頑張っています。", "{word}虽难，但我在努力。"],
    ["{word}習慣をつけましょう。", "养成{word}的习惯吧。"],
    ["{word}のはとても楽しいです。", "{word}非常开心。"],
  ],
  adj: [
    ["これは本当に{word}と思います。", "我觉得这真的很{word}。"],
    ["人生で一番{word}経験でした。", "是人生中最{word}的经历。"],
    ["{word}のは良いことです。", "{word}是好事。"],
  ],
  object: [
    ["新しい{word}を買いたいです。", "想买新的{word}。"],
    ["この{word}は使いやすいです。", "这个{word}很好用。"],
    ["{word}をどこに置きましたか。", "你把{word}放哪了？"],
  ],
  general: [
    ["{word}についてもっと知りたいです。", "想更多了解{word}。"],
    ["{word}は日常生活でよく使います。", "{word}在日常生活中很常用。"],
    ["{word}という言葉を覚えました。", "记住了{word}这个词。"],
    ["{word}の意味を調べてみました。", "查了一下{word}的意思。"],
  ],
};

// Build
const allSentences = [];
const allLinks = [];
let sid = 1;
const seen = new Set();

for (const word of vocab) {
  const cat = classify(word);
  const tpls = TEMPLATES[cat] || TEMPLATES.general;
  // 1-2 sentences per word
  const count = Math.random() < 0.5 ? 2 : 1;
  for (let c = 0; c < count; c++) {
    const tpl = tpls[Math.floor(Math.random() * tpls.length)];
    const jp = tpl[0].replace(/\{word\}/g, word.japanese);
    const cn = tpl[1].replace(/\{word\}/g, word.chinese_meaning);
    if (seen.has(jp)) continue;
    seen.add(jp);
    allSentences.push({ id: sid, japanese: jp, chinese: cn, source: "generated", jlpt_level: word.jlpt_level });
    allLinks.push({ word_id: word.id, sentence_id: sid });
    sid++;
  }
}

fs.writeFileSync("assets/seed/sentences.json", JSON.stringify(allSentences, null, 2));
fs.writeFileSync("assets/seed/word_sentences.json", JSON.stringify(allLinks, null, 2));

// Stats
const ls = allSentences.map(s => s.japanese.length);
const covered = new Set(allLinks.map(l => l.word_id));
console.log("Sentences:", allSentences.length);
console.log("Links:", allLinks.length);
console.log("Words covered:", covered.size, "/", vocab.length);
console.log("Avg length:", (ls.reduce((a,b)=>a+b,0)/ls.length).toFixed(0), "chars (range:", Math.min(...ls), "-", Math.max(...ls)+")");

console.log("\nSamples:");
const samples = [0, 50, 200, 500, 1000, 2000];
samples.forEach(i => {
  if (i < allSentences.length) console.log("  " + allSentences[i].japanese);
});
