// Word types
export interface Word {
  id: number;
  japanese: string;
  reading: string;
  chinese_meaning: string;
  part_of_speech: string | null;
  jlpt_level: number | null;
  source: string | null;
  lesson: number | null;
}

// Sentence types
export interface Sentence {
  id: number;
  japanese: string;
  chinese: string;
  source: string | null;
  jlpt_level: number | null;
}

// Word-Sentence mapping
export interface WordSentence {
  word_id: number;
  sentence_id: number;
}

// User progress
export interface UserProgress {
  id: number;
  word_id: number;
  quiz_mode: number;
  correct_count: number;
  wrong_count: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
}

// Quiz types
export type QuizMode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface QuizOption {
  id: number;
  text: string;
  secondaryText?: string;
  isCorrect: boolean;
  audioText?: string;  // kana reading for TTS (not kanji)
}

export interface QuizQuestion {
  promptWord: Word;
  options: QuizOption[];
}

export interface QuizResult {
  question: QuizQuestion;
  selectedIndex: number;
  isCorrect: boolean;
  // Extra info shown after answering
  allOptionsDetail: {
    text: string;       // The option text
    secondary: string;  // JP->CN or CN->JP mapping
  }[];
  correctSentence?: Sentence;  // For modes 3 & 4
}

// Quiz session state
export interface QuizSession {
  mode: QuizMode;
  questions: QuizQuestion[];
  currentIndex: number;
  results: QuizResult[];
  isFinished: boolean;
}

// Quiz filters
export interface QuizFilters {
  jlptLevels: number[];
  sources: string[];
  questionCount: number;
}

// Favorites and wrong answers
export interface FavoriteWord {
  addedAt: string;
  word: Word;
}

export interface WrongWord {
  wrongCount: number;
  addedAt: string;
  word: Word;
}

// Settings
export interface AppSettings {
  jlptLevels: number[];
  sources: string[];
  dailyGoal: number;
  soundEnabled: boolean;
  coverPaths?: Record<string, string>;
}

// Navigation types
export type RootStackParamList = {
  "(tabs)": undefined;
  "quiz/[mode]": { mode: QuizMode };
};
