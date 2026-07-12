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

// ---- Word question (modes 1 & 2) ----
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
  return { promptWord: correctWord, options: shuffleArray([correctOption, ...distractorOptions]) };
}

// ---- Kana question (modes 5 & 6) ----
function generateKanaQuestion(
  mode: QuizMode,
  availableWords: Word[]
): QuizQuestion | null {
  const kanjiWords = availableWords.filter((w) => w.japanese !== w.reading && w.japanese.length >= 1);
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
  return { promptWord: correctWord, options: shuffleArray([correctOption, ...distractorOptions]) };
}

// ---- Sentence question (modes 3 & 4) — real-time text matching ----
function generateSentenceQuestion(
  mode: QuizMode,
  availableWords: Word[],
  allWords: Word[]
): QuizQuestion | null {
  const { db } = getDatabase();
  const allSents: any[] = db.select().from(sentences).all();
  if (allSents.length < 10) return null;

  if (availableWords.length < 4) return null;

  // Build a map: word -> sentences that actually contain that word
  const sentsByWord = new Map<number, any[]>();
  for (const s of allSents) {
    for (const w of allWords) {
      const jp = w.japanese;
      if (s.japanese.includes(jp) || s.chinese.includes(w.chinese_meaning)) {
        if (!sentsByWord.has(w.id)) sentsByWord.set(w.id, []);
        sentsByWord.get(w.id)!.push(s);
      }
    }
  }

  // Pick words that have at least one real sentence match
  let candidates = availableWords.filter((w) => sentsByWord.has(w.id));
  if (candidates.length < 4) candidates = allWords.filter((w) => sentsByWord.has(w.id));
  if (candidates.length < 4) return null;

  const correctWord = candidates[Math.floor(Math.random() * candidates.length)];
  const wordSents = sentsByWord.get(correctWord.id)!;
  const correctSentence = wordSents[Math.floor(Math.random() * wordSents.length)];

  const isJpPrompt = mode === 3;
  const correctLen = (isJpPrompt ? correctSentence.japanese : correctSentence.chinese).length;
  const usedIds = new Set([correctSentence.id]);

  // Distractors: similar length, exclude the correct sentence
  const ranked = allSents
    .filter((s) => !usedIds.has(s.id))
    .map((s) => {
      const len = (isJpPrompt ? s.japanese : s.chinese).length;
      return { s, diff: Math.abs(len - correctLen) / Math.max(correctLen, 1) };
    })
    .sort((a, b) => a.diff - b.diff);

  const distractors = ranked.slice(0, 10).sort(() => Math.random() - 0.5).slice(0, 3).map((c) => c.s);
  if (distractors.length < 3) return null;

  const correctOption: QuizOption = {
    id: correctSentence.id,
    text: isJpPrompt ? correctSentence.chinese : correctSentence.japanese,
    secondaryText: isJpPrompt ? correctSentence.japanese : correctSentence.chinese,
    isCorrect: true,
  };
  const distractorOptions: QuizOption[] = distractors.map((s) => ({
    id: s.id,
    text: isJpPrompt ? s.chinese : s.japanese,
    secondaryText: isJpPrompt ? s.japanese : s.chinese,
    isCorrect: false,
  }));

  return { promptWord: correctWord, options: shuffleArray([correctOption, ...distractorOptions]) };
}

// ---- Main entry ----
export function generateQuestions(
  mode: QuizMode,
  count: number,
  filters?: { jlptLevels?: number[]; sources?: string[] }
): QuizQuestion[] {
  const { db } = getDatabase();
  const allWords = db.select().from(words).all();

  let availableWords = allWords;
  if (filters?.sources?.length) {
    availableWords = availableWords.filter((w) => {
      const tags = (w.source || "").split(",");
      return filters.sources!.some((s) => tags.includes(s));
    });
  }
  if (filters?.jlptLevels?.length) {
    availableWords = availableWords.filter((w) => {
      const tags = (w.source || "").split(",");
      if (tags.some((t) => t !== "jlpt")) return true;
      return w.jlpt_level != null && filters.jlptLevels!.includes(w.jlpt_level);
    });
  }
  if (availableWords.length === 0) return [];

  const questions: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    let q: QuizQuestion | null = null;
    if (mode === 1 || mode === 2) q = generateWordQuestion(mode, availableWords);
    else if (mode === 5 || mode === 6) q = generateKanaQuestion(mode, availableWords);
    else q = generateSentenceQuestion(mode, availableWords, allWords);
    if (q) questions.push(q);
  }
  return questions;
}

export function getAnswerFeedback(question: QuizQuestion, selectedIndex: number) {
  const opt = question.options[selectedIndex];
  const allOptionsDetail = question.options.map((o) => ({
    text: o.text,
    secondary: o.secondaryText ?? "",
  }));
  return { isCorrect: opt.isCorrect, allOptionsDetail };
}
