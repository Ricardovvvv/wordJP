import type { QuizMode } from "../types";

export const JLPT_LEVELS = [
  { value: 5, label: "N5", description: "入门" },
  { value: 4, label: "N4", description: "基础" },
  { value: 3, label: "N3", description: "中级" },
  { value: 2, label: "N2", description: "中高级" },
  { value: 1, label: "N1", description: "高级" },
] as const;

export const QUIZ_MODES = [
  { value: 1 as const, title: "日→中 单词", description: "看日语单词，选中文释义" },
  { value: 2 as const, title: "中→日 单词", description: "看中文释义，选日语单词" },
  { value: 5 as const, title: "汉字→假名", description: "看汉字单词，选对应的平假名读音" },
  { value: 6 as const, title: "假名→汉字", description: "看平假名和中文释义，选对应汉字" },
  { value: 3 as const, title: "日→中 句子", description: "看日语单词，选合适的中文句子" },
  { value: 4 as const, title: "中→日 句子", description: "看中文释义，选合适的日语句子" },
] as const;

export const DEFAULT_SETTINGS = {
  jlptLevels: [5, 4],
  sources: ["jlpt"],
  dailyGoal: 20,
  soundEnabled: true,
} as const;

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 30] as const;

export const SOURCES = [
  { value: "jlpt", label: "JLPT" },
  { value: "minna_no_nihongo", label: "みんなの日本語" },
  { value: "standard_jp", label: "标准日本语" },
] as const;

// Textbook metadata — shown in the source selector cards
export const TEXTBOOK_INFO: Record<string, {
  title: string;
  titleJP: string;
  author: string;
  publisher: string;
  description: string;
  levels: string;
  totalLessons: number;
  totalWords: number;
  coverColor: string;
  coverAccent: string;
  coverText: string;
  isbn: string;
}> = {
  jlpt: {
    title: "JLPT",
    titleJP: "日本語能力試験",
    author: "日本国際教育支援協会",
    publisher: "凡人社",
    description: "日本语能力测试（JLPT）官方出题基准对应的词汇，整理自历年真题和参考书，按N5~N1难度分级。适合备考JLPT任一等级。",
    levels: "N5 · N4 · N3 · N2 · N1",
    totalLessons: 0,
    totalWords: 14611,
    coverColor: "#1e40af",
    coverAccent: "#3b82f6",
    coverText: "日本語能力試験\nJLPT\n公式語彙",
    isbn: "",
  },
  minna_no_nihongo: {
    title: "みんなの日本語",
    titleJP: "みんなの日本語 初級 I · II",
    author: "スリーエーネットワーク",
    publisher: "スリーエーネットワーク",
    description: "全世界40+国家使用的经典日语教材。初级I·II共50课，涵盖日常会话、基础语法和核心词汇。",
    levels: "初级 I · II（第2版）",
    totalLessons: 50,
    totalWords: 1496,
    coverColor: "#b91c1c",
    coverAccent: "#ef4444",
    coverText: "みんなの\n日本語\n初級",
    isbn: "978-4-88319-603-6",
  },
  standard_jp: {
    title: "标准日本语",
    titleJP: "中日交流標準日本語",
    author: "人民教育出版社",
    publisher: "人民教育出版社",
    description: "中国大陆最广泛使用的日语教材。初级上下共48课，中级32课，高级24课。词汇按课次编排，循序渐进。",
    levels: "初级 · 中级 · 高级",
    totalLessons: 104,
    totalWords: 3586,
    coverColor: "#6d28d9",
    coverAccent: "#8b5cf6",
    coverText: "标准\n日本语\n中日交流",
    isbn: "978-7-107-27830-2",
  },
} as const;

export const COLORS = {
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  correct: "#22c55e",
  correctLight: "#dcfce7",
  wrong: "#ef4444",
  wrongLight: "#fee2e2",
  surface: "#ffffff",
  background: "#f8fafc",
  text: "#0f172a",
  textSecondary: "#64748b",
  border: "#e2e8f0",
} as const;
