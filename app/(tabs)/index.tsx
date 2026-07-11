import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { QUIZ_MODES, SOURCES, JLPT_LEVELS } from "../../src/constants";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { getProgressStats } from "../../src/services/spaced-repetition";
import { generateQuestions } from "../../src/services/quiz";
import { useQuizStore } from "../../src/stores/quizStore";
import type { QuizMode } from "../../src/types";

export default function HomeScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const [stats, setStats] = useState({ todayReviewed: 0, wordsLearned: 0, accuracy: 0 });

  useEffect(() => { try { setStats(getProgressStats()); } catch {} }, []);

  const toggleSource = (src: string) => {
    const updated = settings.sources.includes(src)
      ? settings.sources.filter((s) => s !== src)
      : [...settings.sources, src];
    if (updated.length > 0) updateSettings({ sources: updated });
  };

  const toggleLevel = (lvl: number) => {
    const updated = settings.jlptLevels.includes(lvl)
      ? settings.jlptLevels.filter((l) => l !== lvl)
      : [...settings.jlptLevels, lvl].sort((a, b) => a - b);
    if (updated.length > 0) updateSettings({ jlptLevels: updated });
  };

  const handleStartQuiz = (mode: QuizMode) => {
    const qs = generateQuestions(mode, settings.dailyGoal, { jlptLevels: settings.jlptLevels, sources: settings.sources });
    if (qs.length === 0) return;
    startQuiz(mode, qs);
    router.push(`/quiz/${mode}`);
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Quick filters */}
      <View style={st.filterBar}>
        <Text style={st.filterLabel}>词库</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.chipScroll} contentContainerStyle={{ gap: 6 }}>
          {SOURCES.map((src) => {
            const active = settings.sources.includes(src.value);
            return (
              <Pressable key={src.value} onPress={() => toggleSource(src.value)} style={[st.chip, active && st.chipActive]}>
                <Text style={[st.chipText, active && st.chipTextActive]}>{src.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={[st.filterLabel, { marginTop: 8 }]}>难度</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.chipScroll} contentContainerStyle={{ gap: 6 }}>
          {JLPT_LEVELS.map((lv) => {
            const active = settings.jlptLevels.includes(lv.value);
            return (
              <Pressable key={lv.value} onPress={() => toggleLevel(lv.value)} style={[st.chip, active && st.chipActive]}>
                <Text style={[st.chipText, active && st.chipTextActive]}>{lv.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={st.statsCard}>
        <Text style={st.statsLabel}>今日概况</Text>
        <View style={st.statsRow}>
          <View style={st.stat}><Text style={st.statValue}>{stats.todayReviewed}</Text><Text style={st.statDesc}>今日已学</Text></View>
          <View style={st.divider} />
          <View style={st.stat}><Text style={st.statValue}>{stats.wordsLearned}</Text><Text style={st.statDesc}>已掌握</Text></View>
          <View style={st.divider} />
          <View style={st.stat}><Text style={st.statValue}>{stats.accuracy}%</Text><Text style={st.statDesc}>正确率</Text></View>
        </View>
      </View>

      {/* Mode cards */}
      <Text style={st.modeLabel}>选择练习模式</Text>
      {QUIZ_MODES.map((mode) => (
        <Pressable key={mode.value} onPress={() => handleStartQuiz(mode.value)} style={st.modeCard}>
          <View style={{ flex: 1 }}>
            <Text style={st.modeTitle}>{mode.title}</Text>
            <Text style={st.modeDesc}>{mode.description}</Text>
          </View>
          <View style={st.arrowCircle}><Text style={st.arrow}>→</Text></View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  // Filter bar
  filterBar: { backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" },
  filterLabel: { fontSize: 12, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  chipScroll: { marginBottom: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#64748b" },
  chipTextActive: { color: "#2563eb" },
  // Stats
  statsCard: { backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#f1f5f9" },
  statsLabel: { fontSize: 12, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 22, fontWeight: "700", color: "#1e293b" },
  statDesc: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  divider: { width: 1, backgroundColor: "#f1f5f9" },
  // Modes
  modeLabel: { fontSize: 13, fontWeight: "500", color: "#94a3b8", paddingHorizontal: 16, marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  modeCard: { backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" },
  modeTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  modeDesc: { fontSize: 13, color: "#94a3b8", marginTop: 3 },
  arrowCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  arrow: { fontSize: 16, color: "#94a3b8" },
});
