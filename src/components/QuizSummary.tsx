import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import type { QuizResult } from "../types";

interface QuizSummaryProps {
  results: QuizResult[];
  onRestart: () => void;
  onGoHome: () => void;
}

export function QuizSummary({ results, onRestart, onGoHome }: QuizSummaryProps) {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const total = results.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>答题完成</Text>
        <Text style={styles.score}>{correctCount}/{total}</Text>
        <Text style={styles.accuracy}>正确率 {accuracy}%</Text>
        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${accuracy}%`,
                backgroundColor: accuracy >= 80 ? "#22c55e" : accuracy >= 60 ? "#eab308" : "#ef4444",
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.detailLabel}>详细结果</Text>

      {results.map((result, i) => (
        <View
          key={i}
          style={[
            styles.resultCard,
            { borderLeftColor: result.isCorrect ? "#4ade80" : "#f87171" },
          ]}
        >
          <View style={styles.resultHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.jpText}>{result.question.promptWord.japanese}</Text>
              <Text style={styles.readingText}>{result.question.promptWord.reading}</Text>
            </View>
            <Text style={styles.icon}>{result.isCorrect ? "✅" : "❌"}</Text>
          </View>
          <View style={styles.resultDetail}>
            <Text style={styles.correctAnswer}>
              正确: {result.question.promptWord.chinese_meaning}
            </Text>
            {!result.isCorrect && (
              <Text style={styles.userAnswer}>
                你的选择: {result.question.options[result.selectedIndex].text}
              </Text>
            )}
          </View>
        </View>
      ))}

      <View style={styles.actions}>
        <Pressable onPress={onGoHome} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>返回首页</Text>
        </Pressable>
        <Pressable onPress={onRestart} style={styles.restartBtn}>
          <Text style={styles.restartBtnText}>再来一组</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingBottom: 48 },
  scoreCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  score: { fontSize: 48, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  accuracy: { fontSize: 16, color: "#64748b", marginBottom: 16 },
  track: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  trackFill: { height: "100%", borderRadius: 4 },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  jpText: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  readingText: { fontSize: 14, color: "#94a3b8" },
  icon: { fontSize: 20 },
  resultDetail: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f8fafc" },
  correctAnswer: { fontSize: 14, color: "#475569" },
  userAnswer: { fontSize: 14, color: "#ef4444" },
  actions: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 24 },
  homeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  homeBtnText: { color: "#475569", fontWeight: "600" },
  restartBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  restartBtnText: { color: "#ffffff", fontWeight: "600" },
});
