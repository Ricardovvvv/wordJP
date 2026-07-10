import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { JLPT_LEVELS, QUESTION_COUNT_OPTIONS, SOURCES, TEXTBOOK_INFO } from "../../src/constants";

const BOOK_COVERS: Record<string, string> = {
  jlpt: "📋",
  minna_no_nihongo: "📕",
  standard_jp: "📘",
};

export default function SettingsPage() {
  const { settings, updateSettings, resetToDefaults } = useSettingsStore();

  const toggleJlptLevel = (level: number) => {
    const updated = settings.jlptLevels.includes(level)
      ? settings.jlptLevels.filter((l) => l !== level)
      : [...settings.jlptLevels, level].sort((a, b) => a - b);
    if (updated.length > 0) updateSettings({ jlptLevels: updated });
  };

  const toggleSource = (source: string) => {
    const updated = settings.sources.includes(source)
      ? settings.sources.filter((s) => s !== source)
      : [...settings.sources, source];
    if (updated.length > 0) updateSettings({ sources: updated });
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 教材选择 */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>教材选择</Text>
        <Text style={s.sectionHint}>选择一门或多门教材作为练习词库</Text>

        {SOURCES.map((source) => {
          const active = settings.sources.includes(source.value);
          const info = TEXTBOOK_INFO[source.value];
          if (!info) return null;

          return (
            <Pressable
              key={source.value}
              onPress={() => toggleSource(source.value)}
              style={[s.bookCard, active && s.bookCardActive]}
            >
              {/* Cover area */}
              <View style={[s.bookCover, active && { backgroundColor: info.color }]}>
                <Text style={s.bookCoverEmoji}>{BOOK_COVERS[source.value] || "📖"}</Text>
              </View>

              {/* Info */}
              <View style={s.bookInfo}>
                <View style={s.bookHeader}>
                  <Text style={[s.bookTitle, active && { color: info.color }]}>{source.label}</Text>
                  {active && <Text style={[s.activeBadge]}>已选</Text>}
                </View>
                {info.titleJP && <Text style={s.bookTitleJP}>{info.titleJP}</Text>}
                <Text style={s.bookDesc} numberOfLines={2}>{info.description}</Text>
                <View style={s.bookMeta}>
                  <Text style={s.bookMetaText}>📝 {info.author}</Text>
                  <Text style={s.bookMetaText}>📚 {info.totalLessons > 0 ? `${info.totalLessons}课` : `~${info.totalWords.toLocaleString()}词`}</Text>
                </View>
                <Text style={s.bookLevels}>{info.levels}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* JLPT 等级 */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>JLPT 难度等级</Text>
        <Text style={s.sectionHint}>仅在选择 JLPT 词库时生效</Text>
        <View style={s.chipRow}>
          {JLPT_LEVELS.map((level) => {
            const active = settings.jlptLevels.includes(level.value);
            return (
              <Pressable
                key={level.value}
                onPress={() => toggleJlptLevel(level.value)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>
                  {level.label} <Text style={s.chipDesc}>{level.description}</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 每日题数 */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>每日题目数量</Text>
        <View style={s.chipRow}>
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <Pressable
              key={count}
              onPress={() => updateSettings({ dailyGoal: count })}
              style={[s.countChip, settings.dailyGoal === count && s.countChipActive]}
            >
              <Text style={[s.countText, settings.dailyGoal === count && s.countTextActive]}>{count}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 发音 */}
      <View style={s.section}>
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>发音</Text>
            <Text style={s.switchDesc}>点击单词旁的🔈按钮播放日语发音</Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(v) => updateSettings({ soundEnabled: v })}
            trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
            thumbColor={settings.soundEnabled ? "#2563eb" : "#f1f5f9"}
          />
        </View>
      </View>

      {/* 恢复默认 */}
      <Pressable onPress={resetToDefaults} style={s.resetBtn}>
        <Text style={s.resetText}>恢复默认设置</Text>
      </Pressable>

      <Text style={s.version}>wordJP v1.0.0 · 16,860 词</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  section: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9",
  },
  sectionTitle: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: "#cbd5e1", marginBottom: 14 },

  // Book cards
  bookCard: {
    flexDirection: "row",
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
    alignItems: "center",
  },
  bookCardActive: {
    borderColor: "#93c5fd",
    backgroundColor: "#fafbff",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  bookCover: {
    width: 56,
    height: 76,
    borderRadius: 8,
    backgroundColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  bookCoverEmoji: { fontSize: 26 },
  bookInfo: { flex: 1 },
  bookHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  bookTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  bookTitleJP: { fontSize: 12, color: "#94a3b8", marginBottom: 4 },
  activeBadge: {
    fontSize: 10, fontWeight: "700", color: "#2563eb",
    backgroundColor: "#eff6ff", paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4, overflow: "hidden",
  },
  bookDesc: { fontSize: 12, color: "#64748b", lineHeight: 17, marginBottom: 6 },
  bookMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 2,
  },
  bookMetaText: { fontSize: 11, color: "#94a3b8" },
  bookLevels: { fontSize: 11, fontWeight: "600", color: "#64748b" },

  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  chipText: { fontSize: 14, fontWeight: "500", color: "#64748b" },
  chipTextActive: { color: "#2563eb" },
  chipDesc: { fontSize: 12, fontWeight: "400" },

  // Count
  countChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  countChipActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  countText: { fontWeight: "500", color: "#64748b" },
  countTextActive: { color: "#2563eb" },

  // Switch
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  switchDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  // Reset
  resetBtn: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 24,
    borderRadius: 16, padding: 16, alignItems: "center",
    borderWidth: 1, borderColor: "#f1f5f9",
  },
  resetText: { color: "#f87171", fontWeight: "500" },

  version: { textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 24 },
});
