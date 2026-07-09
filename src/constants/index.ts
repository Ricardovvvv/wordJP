export const JLPT_LEVELS = [
  { value: 5, label: "N5", description: "入门" },
  { value: 4, label: "N4", description: "基础" },
  { value: 3, label: "N3", description: "中级" },
  { value: 2, label: "N2", description: "中高级" },
  { value: 1, label: "N1", description: "高级" },
] as const;

export const QUIZ_MODES = [
  { value: 1 as const, title: "日→中 单词", description: "看日语单词，选中文释义", icon: "jp-cn-word" },
  { value: 2 as const, title: "中→日 单词", description: "看中文释义，选日语单词", icon: "cn-jp-word" },
  { value: 5 as const, title: "汉字→假名", description: "看汉字单词，选对应的平假名读音", icon: "kanji-kana" },
  { value: 6 as const, title: "假名→汉字", description: "看平假名和中文释义，选对应汉字", icon: "kana-kanji" },
  { value: 3 as const, title: "日→中 句子", description: "看日语单词，选合适的句子", icon: "jp-cn-sentence" },
  { value: 4 as const, title: "中→日 句子", description: "看中文释义，选合适的日语句子", icon: "cn-jp-sentence" },
] as const;

export const DEFAULT_SETTINGS = {
  jlptLevels: [5, 4],
  sources: ["jlpt"],
  dailyGoal: 20,
  soundEnabled: true,
  modeWeights: { 1: 1, 2: 1, 3: 1, 4: 1 },
} as const;

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20, 30] as const;

export const SOURCES = [
  { value: "jlpt", label: "JLPT" },
  { value: "minna_no_nihongo", label: "みんなの日本語" },
] as const;

export const MINNA_LESSONS = [
  { value: 0, label: "全部" },
  ...Array.from({ length: 25 }, (_, i) => ({ value: i + 1, label: `第${i + 1}课` })),
] as const;

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
