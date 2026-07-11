import { getDatabase, eq, and, inArray, ne } from "../db/client";
import { words, sentences, wordSentences } from "../db/client";
import type { Word, QuizMode, QuizQuestion, QuizOption } from "../types";

function getRandomItems<T>(arr: T[], count: number, exclude?: T): T[] {
  const filtered = exclude != null ? arr.filter((x) => x !== exclude) : [...arr];
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ---- Real-time sentence generator ----
// No JSON files, no network — pure template + word data = random sentence

interface SentTpl { ja: string; cn: string }

function classifyWord(w: Word): string {
  const m = (w.chinese_meaning || "").toLowerCase();
  const j = w.japanese || "";
  if (/[0-9０-９]/.test(j) || /[一二三四五六七八九十百千万億]/.test(j) || /^(十|百|千|万|億)/.test(j)) return "number";
  if (/国|市|町|村|駅|空港|公園|学校|病院|図書館|店|銀行|旅館|道|場|所|館/.test(m)) return "place";
  if (/[上下左右東西南北中外前後隣]/.test(j) && j.length <= 2) return "place";
  if (/人|者|先生|学生|友|親|子|兄|弟|姉|妹|夫|婦|家族|方|様/.test(m)) return "person";
  if (/食|飲|肉|魚|野菜|果物|料理|味|酒|茶|水|飯|米|パン|果|菓子/.test(m)) return "food";
  if (/日|月|年|曜|朝|昼|夜|時|分|秒|時間|週|今|昨|明|先|来/.test(m)) return "time";
  if (w.part_of_speech === "verb" || (w.part_of_speech && w.part_of_speech.includes("動")) || /(する|ます|った|した|いて|いて|った)$/.test(j) || /(う|く|ぐ|す|つ|ぬ|ぶ|む|る)$/.test(j) && j.length > 2) return "verb";
  if (w.part_of_speech === "adj-i" || w.part_of_speech === "adj-na" || (w.part_of_speech && w.part_of_speech.includes("形")) || /い$/.test(j)) return "adj";
  if (/本|机|椅子|車|電車|電話|鞄|服|靴|帽子|傘|時計|新聞|写真|地図|辞書|紙|書|具/.test(m)) return "object";
  if (/天気|気温|雨|雪|風|雲|空|太陽|星|月|海|山|川|森|花|木|草/.test(m)) return "nature";
  return "general";
}

// All templates use {word} as placeholder — injected with word.japanese or word.chinese_meaning
const SENTENCE_TPLS: Record<string, SentTpl[]> = {
  place: [
    { ja: "昨日、{word}に行ってきました。", cn: "昨天去了{word}。" },
    { ja: "{word}はとても賑やかで楽しい場所です。", cn: "{word}是非常热闹好玩的地方。" },
    { ja: "{word}で友達と待ち合わせをしました。", cn: "和朋友约在{word}见面。" },
    { ja: "{word}まで電車でどのくらいかかりますか。", cn: "坐电车到{word}要多久？" },
    { ja: "週末に{word}へ買い物に行く予定です。", cn: "周末打算去{word}买东西。" },
    { ja: "{word}は初めてだったので少し迷いました。", cn: "第一次去{word}所以有点迷路。" },
    { ja: "{word}の近くに美味しいラーメン屋があります。", cn: "{word}附近有好吃的拉面店。" },
  ],
  person: [
    { ja: "{word}は私の大切な友達です。", cn: "{word}是我重要的朋友。" },
    { ja: "昨日、街で{word}にばったり会いました。", cn: "昨天在街上偶遇了{word}。" },
    { ja: "{word}は日本語がとても上手になりました。", cn: "{word}的日语进步了很多。" },
    { ja: "今度{word}と一緒に旅行に行きたいです。", cn: "下次想和{word}一起去旅行。" },
    { ja: "{word}の話を聞いてすごく感動しました。", cn: "听了{word}的话非常感动。" },
    { ja: "{word}にお土産をもらいました。", cn: "收到了{word}的伴手礼。" },
  ],
  food: [
    { ja: "昨日の晩ご飯に{word}を食べました。", cn: "昨晚吃了{word}。" },
    { ja: "{word}の作り方を母から教わりました。", cn: "从妈妈那里学会了{word}的做法。" },
    { ja: "この店の{word}は評判がいいそうです。", cn: "听说这家店的{word}口碑很好。" },
    { ja: "{word}に合うお酒を探しています。", cn: "在找配{word}的酒。" },
    { ja: "{word}は体にいいので毎日食べています。", cn: "{word}对身体好所以每天都吃。" },
    { ja: "{word}を食べ過ぎてお腹がいっぱいです。", cn: "{word}吃太多肚子好饱。" },
    { ja: "日本に来て初めて{word}を味わいました。", cn: "来日本后第一次尝到了{word}。" },
  ],
  time: [
    { ja: "{word}は何か特別な予定がありますか。", cn: "{word}有什么特别的安排吗？" },
    { ja: "{word}までにこの仕事を終わらせます。", cn: "会在{word}之前完成这个工作。" },
    { ja: "{word}から新しい生活が始まりました。", cn: "从{word}开始了新生活。" },
    { ja: "次に会えるのは{word}になりそうです。", cn: "下次见面大概是{word}了。" },
    { ja: "{word}の天気予報をチェックしました。", cn: "查了{word}的天气预报。" },
    { ja: "{word}は忙しかったけど充実していました。", cn: "{word}很忙但很充实。" },
  ],
  number: [
    { ja: "教室には学生が{word}人います。", cn: "教室里有{word}个学生。" },
    { ja: "{word}番線の電車に乗ってください。", cn: "请坐{word}号线的电车。" },
    { ja: "この本は全部で{word}ページあります。", cn: "这本书一共有{word}页。" },
  ],
  verb: [
    { ja: "毎日{word}のが私の日課です。", cn: "每天{word}是我的日常功课。" },
    { ja: "{word}のは大変ですが、やりがいがあります。", cn: "{word}很辛苦，但很有意义。" },
    { ja: "子供の頃から{word}のが好きでした。", cn: "从小就喜欢{word}。" },
    { ja: "{word}習慣を身につけることが大切です。", cn: "养成{word}的习惯很重要。" },
    { ja: "うっかり{word}のを忘れてしまいました。", cn: "不小心忘了{word}。" },
    { ja: "{word}前にちゃんと準備をしてください。", cn: "{word}之前请好好准备。" },
    { ja: "{word}のは難しくても諦めたくないです。", cn: "{word}虽然难，但我不想放弃。" },
    { ja: "{word}のは思ったより簡単でした。", cn: "{word}比想象中简单。" },
  ],
  adj: [
    { ja: "これは今までで一番{word}経験です。", cn: "这是至今为止最{word}的经历。" },
    { ja: "もっと{word}のを探しています。", cn: "在找更{word}的。" },
    { ja: "最近{word}と感じることが多いです。", cn: "最近常常觉得{word}。" },
    { ja: "{word}ほうを選んだ方がいいですよ。", cn: "最好选{word}的那个。" },
    { ja: "{word}のは悪いことではありません。", cn: "{word}并不是坏事。" },
  ],
  object: [
    { ja: "新しい{word}を買おうか迷っています。", cn: "在犹豫要不要买新的{word}。" },
    { ja: "この{word}はもう五年も使っています。", cn: "这个{word}已经用了五年了。" },
    { ja: "{word}をどこに置いたか忘れてしまいました。", cn: "忘了把{word}放哪了。" },
    { ja: "この{word}はとても使いやすくて気に入っています。", cn: "这个{word}很好用，很喜欢。" },
    { ja: "{word}が壊れたので修理に出しました。", cn: "{word}坏了所以拿去修了。" },
  ],
  nature: [
    { ja: "今日は{word}がとても綺麗に見えます。", cn: "今天{word}看起来特别美。" },
    { ja: "{word}を見ながら散歩するのが好きです。", cn: "喜欢边看{word}边散步。" },
    { ja: "{word}の季節がやってきました。", cn: "{word}的季节到了。" },
    { ja: "窓から{word}が見えて気持ちがいいです。", cn: "从窗户能看到{word}，心情很好。" },
  ],
  general: [
    { ja: "最近{word}についてよく考えます。", cn: "最近经常思考关于{word}的事。" },
    { ja: "{word}という言葉を初めて聞きました。", cn: "第一次听到{word}这个词。" },
    { ja: "先生に{word}の意味を教えてもらいました。", cn: "老师教了我{word}的意思。" },
    { ja: "{word}は日本語の勉強でよく出てきます。", cn: "{word}在日语学习里经常出现。" },
    { ja: "{word}を使った例文を作ってみましょう。", cn: "用{word}造个例句试试吧。" },
    { ja: "みんなは{word}についてどう思いますか。", cn: "大家对{word}怎么看？" },
  ],
};

function generateRealTimeSentence(word: Word): SentTpl {
  const cat = classifyWord(word);
  const tpls = SENTENCE_TPLS[cat] || SENTENCE_TPLS.general;
  const tpl = tpls[Math.floor(Math.random() * tpls.length)];
  return {
    ja: tpl.ja.replace(/\{word\}/g, word.japanese),
    cn: tpl.cn.replace(/\{word\}/g, word.chinese_meaning),
  };
}

// ---- Quiz generators ----

function generateWordQuestion(
  mode: QuizMode,
  availableWords: Word[]
): QuizQuestion | null {
  if (availableWords.length < 4) return null;

  const correctWord = availableWords[Math.floor(Math.random() * availableWords.length)];
  const distractors = getRandomItems(availableWords, 3, correctWord);
  const isJpPrompt = mode === 1;

  const correctOption: QuizOption = {
    id: correctWord.id,
    text: isJpPrompt ? correctWord.chinese_meaning : correctWord.japanese,
    secondaryText: isJpPrompt ? correctWord.japanese : correctWord.chinese_meaning,
    isCorrect: true,
  };

  const distractorOptions: QuizOption[] = distractors.map((w) => ({
    id: w.id,
    text: isJpPrompt ? w.chinese_meaning : w.japanese,
    secondaryText: isJpPrompt ? w.japanese : w.chinese_meaning,
    isCorrect: false,
  }));

  return {
    promptWord: correctWord,
    options: shuffleArray([correctOption, ...distractorOptions]),
  };
}

function generateKanaQuestion(
  mode: QuizMode,
  availableWords: Word[]
): QuizQuestion | null {
  const kanjiWords = availableWords.filter(
    (w) => w.japanese !== w.reading && w.japanese.length >= 1
  );
  if (kanjiWords.length < 4) return null;

  const correctWord = kanjiWords[Math.floor(Math.random() * kanjiWords.length)];
  const distractors = getRandomItems(kanjiWords, 3, correctWord);
  const isKanjiPrompt = mode === 5;

  const correctOption: QuizOption = {
    id: correctWord.id,
    text: isKanjiPrompt ? correctWord.reading : correctWord.japanese,
    secondaryText: isKanjiPrompt ? correctWord.japanese : correctWord.reading,
    isCorrect: true,
  };

  const distractorOptions: QuizOption[] = distractors.map((w) => ({
    id: w.id,
    text: isKanjiPrompt ? w.reading : w.japanese,
    secondaryText: isKanjiPrompt ? w.japanese : w.reading,
    isCorrect: false,
  }));

  return {
    promptWord: correctWord,
    options: shuffleArray([correctOption, ...distractorOptions]),
  };
}

// Real-time sentence question — no DB lookup needed
function generateSentenceQuestion(
  mode: QuizMode,
  availableWords: Word[],
  allWords: Word[]
): QuizQuestion | null {
  if (availableWords.length < 4) return null;

  // Pick a correct word
  const correctWord = availableWords[Math.floor(Math.random() * availableWords.length)];

  // Generate the CORRECT sentence in real time (always contains the target word)
  const correctSent = generateRealTimeSentence(correctWord);

  // Generate 3 distractor sentences from other words (will NOT contain the target word)
  const distractorWords = getRandomItems(allWords, 6, correctWord);
  const distractorSents: SentTpl[] = [];
  for (const dw of distractorWords) {
    const s = generateRealTimeSentence(dw);
    // Ensure distractor doesn't accidentally contain the correct word's text
    if (!s.ja.includes(correctWord.japanese) && !s.cn.includes(correctWord.chinese_meaning)) {
      distractorSents.push(s);
    }
    if (distractorSents.length >= 3) break;
  }
  if (distractorSents.length < 3) {
    // Fallback: generate more
    const more = getRandomItems(allWords, 10, correctWord);
    for (const dw of more) {
      const s = generateRealTimeSentence(dw);
      if (!s.ja.includes(correctWord.japanese) && !s.cn.includes(correctWord.chinese_meaning)) {
        distractorSents.push(s);
      }
      if (distractorSents.length >= 3) break;
    }
  }
  if (distractorSents.length < 3) return null;

  const isJpPrompt = mode === 3;

  const correctOption: QuizOption = {
    id: 0, // synthetic ID — not from DB
    text: isJpPrompt ? correctSent.cn : correctSent.ja,
    secondaryText: isJpPrompt ? correctSent.ja : correctSent.cn,
    isCorrect: true,
  };

  const distractorOptions: QuizOption[] = distractorSents.map((s, i) => ({
    id: i + 1,
    text: isJpPrompt ? s.cn : s.ja,
    secondaryText: isJpPrompt ? s.ja : s.cn,
    isCorrect: false,
  }));

  return {
    promptWord: correctWord,
    options: shuffleArray([correctOption, ...distractorOptions]),
  };
}

export function generateQuestions(
  mode: QuizMode,
  count: number,
  filters?: { jlptLevels?: number[]; sources?: string[] }
): QuizQuestion[] {
  const { db } = getDatabase();
  const allWords = db.select().from(words).all();

  let availableWords = allWords;

  if (filters?.sources && filters.sources.length > 0) {
    availableWords = availableWords.filter((w) => {
      const tags = (w.source || "").split(",");
      return filters.sources!.some((s) => tags.includes(s));
    });
  }

  if (filters?.jlptLevels && filters.jlptLevels.length > 0) {
    availableWords = availableWords.filter((w) => {
      const tags = (w.source || "").split(",");
      if (tags.some((t) => t !== "jlpt")) return true;
      return w.jlpt_level != null && filters.jlptLevels!.includes(w.jlpt_level);
    });
  }

  if (availableWords.length === 0) return [];

  const questions: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    let question: QuizQuestion | null = null;
    if (mode === 1 || mode === 2) {
      question = generateWordQuestion(mode, availableWords);
    } else if (mode === 5 || mode === 6) {
      question = generateKanaQuestion(mode, availableWords);
    } else {
      question = generateSentenceQuestion(mode, availableWords, allWords);
    }
    if (question) questions.push(question);
  }

  return questions;
}

export function getAnswerFeedback(
  question: QuizQuestion,
  selectedIndex: number
) {
  const selectedOption = question.options[selectedIndex];
  const isCorrect = selectedOption.isCorrect;

  const allOptionsDetail = question.options.map((opt) => {
    return {
      text: opt.text,
      secondary: opt.secondaryText ?? "",
    };
  });

  return { isCorrect, allOptionsDetail };
}

export function getWordExtraInfo(wordId: number) {
  const { db } = getDatabase();
  const refs = db
    .select({ sentence_id: wordSentences.sentence_id })
    .from(wordSentences)
    .where(eq(wordSentences.word_id, wordId))
    .all();

  const relatedSentences = refs
    .map((ref) =>
      db.select().from(sentences).where(eq(sentences.id, ref.sentence_id)).all()[0]
    )
    .filter(Boolean);

  return { relatedSentences };
}
