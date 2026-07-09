import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { JLPT_LEVELS, QUESTION_COUNT_OPTIONS } from "../../src/constants";

export default function SettingsScreen() {
  const { settings, updateSettings, resetToDefaults } = useSettingsStore();

  const toggleJlptLevel = (level: number) => {
    const current = settings.jlptLevels;
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level].sort((a, b) => a - b);
    if (updated.length > 0) updateSettings({ jlptLevels: updated });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>JLPT 等级</Text>
        <View style={styles.chipRow}>
          {JLPT_LEVELS.map((level) => {
            const active = settings.jlptLevels.includes(level.value);
            return (
              <Pressable
                key={level.value}
                onPress={() => toggleJlptLevel(level.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {level.label} <Text style={[styles.chipDesc, active && styles.chipDescActive]}>{level.description}</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>每日题目数量</Text>
        <View style={styles.chipRow}>
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <Pressable
              key={count}
              onPress={() => updateSettings({ dailyGoal: count })}
              style={[styles.countChip, settings.dailyGoal === count && styles.countChipActive]}
            >
              <Text style={[styles.countText, settings.dailyGoal === count && styles.countTextActive]}>
                {count}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>发音</Text>
            <Text style={styles.switchDesc}>点击单词旁的按钮播放发音</Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(v) => updateSettings({ soundEnabled: v })}
            trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
            thumbColor={settings.soundEnabled ? "#2563eb" : "#f1f5f9"}
          />
        </View>
      </View>

      <Pressable onPress={resetToDefaults} style={styles.resetBtn}>
        <Text style={styles.resetText}>恢复默认设置</Text>
      </Pressable>

      <Text style={styles.version}>wordJP v1.0.0 · Made with Expo</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  section: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9",
  },
  sectionTitle: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  chipText: { fontSize: 14, fontWeight: "500", color: "#64748b" },
  chipTextActive: { color: "#2563eb" },
  chipDesc: { fontSize: 12, fontWeight: "400" },
  chipDescActive: {},
  countChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  countChipActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  countText: { fontWeight: "500", color: "#64748b" },
  countTextActive: { color: "#2563eb" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  switchDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  resetBtn: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 24,
    borderRadius: 16, padding: 16, alignItems: "center",
    borderWidth: 1, borderColor: "#f1f5f9",
  },
  resetText: { color: "#f87171", fontWeight: "500" },
  version: { textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 24 },
});
