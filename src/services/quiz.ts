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

// Generate a question for Quiz modes 1 & 2 (word-to-word)
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

// Generate a question for Quiz modes 5 & 6 (kanji ↔ kana)
// Mode 5: Show kanji → pick the correct reading
// Mode 6: Show reading + meaning → pick the correct kanji
function generateKanaQuestion(
  mode: QuizMode,
  availableWords: Word[]
): QuizQuestion | null {
  // Only use words where kanji and reading differ (actual kanji words)
  const kanjiWords = availableWords.filter(
    (w) => w.japanese !== w.reading && w.japanese.length >= 1
  );
  if (kanjiWords.length < 4) return null;

  const correctWord = kanjiWords[Math.floor(Math.random() * kanjiWords.length)];
  const distractors = getRandomItems(kanjiWords, 3, correctWord);

  const isKanjiPrompt = mode === 5; // true = show kanji, pick reading

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

// Generate a question for Quiz modes 3 & 4 (word-to-sentence)
function generateSentenceQuestion(
  mode: QuizMode,
  availableWords: Word[],
  allWords: Word[]
): QuizQuestion | null {
  const { db } = getDatabase();

  // Get all word IDs that have sentences in one query
  const allWordIds = availableWords.map((w) => w.id);
  if (allWordIds.length === 0) return null;

  const linkedIds = new Set(
    db
      .selectDistinct({ word_id: wordSentences.word_id })
      .from(wordSentences)
      .where(inArray(wordSentences.word_id, allWordIds))
      .all()
      .map((r) => r.word_id)
  );

  let wordsWithSentences = availableWords.filter((w) => linkedIds.has(w.id));

  // Fallback: if too few sentence-linked words, expand to all words with sentences
  if (wordsWithSentences.length < 4) {
    const allLinkedIds = new Set(
      db
        .selectDistinct({ word_id: wordSentences.word_id })
        .from(wordSentences)
        .all()
        .map((r) => r.word_id)
    );
    wordsWithSentences = allWords.filter((w) => allLinkedIds.has(w.id));
    if (wordsWithSentences.length < 4) return null;
  }

  if (wordsWithSentences.length < 1) return null;

  const correctWord =
    wordsWithSentences[Math.floor(Math.random() * wordsWithSentences.length)];

  // Get the correct sentence
  const correctSentenceRef = db
    .select({ sentence_id: wordSentences.sentence_id })
    .from(wordSentences)
    .where(eq(wordSentences.word_id, correctWord.id))
    .all();

  if (correctSentenceRef.length === 0) return null;
  const ref = correctSentenceRef[Math.floor(Math.random() * correctSentenceRef.length)];
  const correctSentence = db
    .select()
    .from(sentences)
    .where(eq(sentences.id, ref.sentence_id))
    .all()[0];

  if (!correctSentence) return null;

  // Get 3 distractor sentences
  const distractorSentences = db
    .select()
    .from(sentences)
    .where(ne(sentences.id, correctSentence.id))
    .limit(50)
    .all();

  if (distractorSentences.length < 3) return null;

  const shuffledDistractors = shuffleArray(distractorSentences).slice(0, 3);

  const isJpPrompt = mode === 3;

  const correctOption: QuizOption = {
    id: correctSentence.id,
    text: isJpPrompt ? correctSentence.chinese : correctSentence.japanese,
    secondaryText: isJpPrompt ? correctSentence.japanese : correctSentence.chinese,
    isCorrect: true,
  };

  const distractorOptions: QuizOption[] = shuffledDistractors.map((s) => ({
    id: s.id,
    text: isJpPrompt ? s.chinese : s.japanese,
    secondaryText: isJpPrompt ? s.japanese : s.chinese,
    isCorrect: false,
  }));

  return {
    promptWord: correctWord,
    options: shuffleArray([correctOption, ...distractorOptions]),
  };
}

// Generate multiple questions for a quiz session
export function generateQuestions(
  mode: QuizMode,
  count: number,
  filters?: { jlptLevels?: number[]; sources?: string[] }
): QuizQuestion[] {
  const { db } = getDatabase();

  // Fetch all words first
  const allWords = db.select().from(words).all();

  // Filter in-memory for precise control
  let availableWords = allWords;

  if (filters?.sources && filters.sources.length > 0) {
    availableWords = availableWords.filter((w) => {
      const tags = (w.source || "").split(",");
      return filters.sources!.some((s) => tags.includes(s));
    });
  }

  if (filters?.jlptLevels && filters.jlptLevels.length > 0) {
    availableWords = availableWords.filter((w) => {
      // Textbook-only words (no jlpt_level): always include
      const tags = (w.source || "").split(",");
      if (tags.some((t) => t !== "jlpt")) return true;
      // JLPT words: filter by level
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

// Get detailed feedback after answering
export function getAnswerFeedback(
  question: QuizQuestion,
  selectedIndex: number
) {
  const selectedOption = question.options[selectedIndex];
  const isCorrect = selectedOption.isCorrect;

  const allOptionsDetail = question.options.map((opt) => {
    const word = getDatabase()
      .db.select()
      .from(words)
      .where(eq(words.id, opt.id))
      .all()[0];

    return {
      text: opt.text,
      secondary: word
        ? `${word.japanese}（${word.reading}）= ${word.chinese_meaning}`
        : opt.secondaryText ?? "",
    };
  });

  return { isCorrect, allOptionsDetail };
}

// Get extra info for a word (sentence examples, etc.)
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
