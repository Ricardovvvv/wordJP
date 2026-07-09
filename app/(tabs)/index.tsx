import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { QUIZ_MODES } from "../../src/constants";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { getProgressStats } from "../../src/services/spaced-repetition";
import { generateQuestions } from "../../src/services/quiz";
import { useQuizStore } from "../../src/stores/quizStore";

export default function HomeScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const [stats, setStats] = useState({ todayReviewed: 0, wordsLearned: 0, accuracy: 0 });

  useEffect(() => {
    try {
      setStats(getProgressStats());
    } catch {}
  }, []);

  const handleStartQuiz = (mode: 1 | 2 | 3 | 4) => {
    const questions = generateQuestions(mode, settings.dailyGoal, {
      jlptLevels: settings.jlptLevels,
      sources: settings.sources,
    });
    if (questions.length === 0) return;
    startQuiz(mode, questions);
    router.push(`/quiz/${mode}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>今日概况</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.todayReviewed}</Text>
            <Text style={styles.statDesc}>今日已学</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.wordsLearned}</Text>
            <Text style={styles.statDesc}>已掌握</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.accuracy}%</Text>
            <Text style={styles.statDesc}>正确率</Text>
          </View>
        </View>
      </View>

      <Text style={styles.modeLabel}>选择练习模式</Text>

      {QUIZ_MODES.map((mode) => (
        <Pressable
          key={mode.value}
          onPress={() => handleStartQuiz(mode.value)}
          style={styles.modeCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeDesc}>{mode.description}</Text>
          </View>
          <View style={styles.arrowCircle}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </Pressable>
      ))}

      <View style={styles.info}>
        <Text style={styles.infoText}>
          当前词库: {settings.jlptLevels.map((l) => `N${l}`).join(", ")} · 每日 {settings.dailyGoal} 题
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingBottom: 40 },
  statsCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 24, fontWeight: "700", color: "#1e293b" },
  statDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  divider: { width: 1, backgroundColor: "#f1f5f9" },
  modeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modeCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  modeTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  modeDesc: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { fontSize: 18, color: "#94a3b8" },
  info: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { fontSize: 12, color: "#64748b" },
});
