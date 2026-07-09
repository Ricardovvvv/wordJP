import { View, Text, StyleSheet } from "react-native";
import { AudioButton } from "./AudioButton";
import type { QuizMode, Word } from "../types";
import { COLORS } from "../constants";

interface WordCardProps {
  word: Word;
  mode: QuizMode;
  showMeaning?: boolean;
}

export function WordCard({ word, mode, showMeaning = false }: WordCardProps) {
  const isJpPrompt = mode === 1 || mode === 3;
  const isKanjiPrompt = mode === 5;
  const isKanaPrompt = mode === 6;
  const isKanaMode = isKanjiPrompt || isKanaPrompt;

  let label: string;
  let mainText: string;
  let hintText: string;

  if (isKanjiPrompt) {
    label = "汉字";
    mainText = word.japanese;
    hintText = word.chinese_meaning;
  } else if (isKanaPrompt) {
    label = "读音·释义";
    mainText = word.reading;
    hintText = word.chinese_meaning;
  } else if (isJpPrompt) {
    label = "日语单词";
    mainText = word.japanese;
    hintText = word.reading;
  } else {
    label = "中文释义";
    mainText = word.chinese_meaning;
    hintText = "";
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wordRow}>
        <Text style={[styles.mainText, isKanaPrompt && { fontSize: 26 }]}>
          {mainText}
        </Text>
        {(isJpPrompt || isKanjiPrompt) && <AudioButton text={word.japanese} />}
        {isKanaPrompt && <AudioButton text={word.reading} />}
      </View>
      {hintText ? <Text style={styles.reading}>{hintText}</Text> : null}
      {showMeaning && (
        <View style={styles.meaningSection}>
          <Text style={styles.meaningText}>
            {isKanaMode
              ? `${word.japanese}（${word.reading}）= ${word.chinese_meaning}`
              : isJpPrompt
                ? word.chinese_meaning
                : `${word.japanese}（${word.reading}）`}
          </Text>
        </View>
      )}
      {word.jlpt_level && (
        <View style={styles.jlptBadge}>
          <Text style={styles.jlptText}>N{word.jlpt_level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  mainText: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  reading: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  meaningSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    width: "100%",
  },
  meaningText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  jlptBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  jlptText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
});
