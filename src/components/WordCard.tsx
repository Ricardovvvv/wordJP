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

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {isJpPrompt ? "日语单词" : "中文释义"}
      </Text>
      <View style={styles.wordRow}>
        <Text style={styles.mainText}>
          {isJpPrompt ? word.japanese : word.chinese_meaning}
        </Text>
        {isJpPrompt && <AudioButton text={word.japanese} />}
      </View>
      {isJpPrompt && <Text style={styles.reading}>{word.reading}</Text>}
      {showMeaning && (
        <View style={styles.meaningSection}>
          <Text style={styles.meaningText}>
            {isJpPrompt
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
