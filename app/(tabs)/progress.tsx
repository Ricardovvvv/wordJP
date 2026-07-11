import { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { getProgressStats } from "../../src/services/spaced-repetition";

export default function ProgressScreen() {
  const [stats, setStats] = useState({
    totalReviewed: 0, totalCorrect: 0, totalWrong: 0,
    accuracy: 0, wordsLearned: 0, todayReviewed: 0,
  });

  useFocusEffect(
    useCallback(() => {
      try { setStats(getProgressStats()); } catch {}
    }, [])
  );

  const total = stats.totalCorrect + stats.totalWrong;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>累计学习</Text>
        <Text style={styles.heroValue}>{stats.wordsLearned}</Text>
        <Text style={styles.heroDesc}>个单词已掌握</Text>
        <View style={{ width: "100%", marginTop: 24 }}>
          <View style={styles.accuracyHeader}>
            <Text style={styles.accuracyLabel}>正确率</Text>
            <Text style={styles.accuracyValue}>{stats.accuracy}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${stats.accuracy}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>详细数据</Text>
        <Row label="今日学习" value={`${stats.todayReviewed} 题`} />
        <Row label="累计答题" value={`${total} 题`} />
        <Row label="回答正确" value={`${stats.totalCorrect} 题`} color="#16a34a" />
        <Row label="回答错误" value={`${stats.totalWrong} 题`} color="#ef4444" last />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <View style={[rowStyles.row, !last && rowStyles.border]}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  label: { fontSize: 15, color: "#475569" },
  value: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  heroCard: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: "#f1f5f9",
  },
  heroLabel: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  heroValue: { fontSize: 48, fontWeight: "700", color: "#2563eb", marginBottom: 4 },
  heroDesc: { fontSize: 14, color: "#94a3b8" },
  accuracyHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  accuracyLabel: { fontSize: 12, color: "#94a3b8" },
  accuracyValue: { fontSize: 12, fontWeight: "700", color: "#334155" },
  track: { height: 10, backgroundColor: "#f1f5f9", borderRadius: 5, overflow: "hidden" },
  trackFill: { height: "100%", backgroundColor: "#3b82f6", borderRadius: 5 },
  detailCard: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9", marginBottom: 30,
  },
  detailTitle: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
});
