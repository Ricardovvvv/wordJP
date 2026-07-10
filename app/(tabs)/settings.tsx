import { View, Text, ScrollView, Pressable, Switch, StyleSheet, Image } from "react-native";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { JLPT_LEVELS, QUESTION_COUNT_OPTIONS, SOURCES, TEXTBOOK_INFO } from "../../src/constants";

export default function SettingsScreen() {
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
      <Text style={s.sectionHeader}>教材选择</Text>
      <Text style={s.sectionHint}>选择一本或多本教材作为练习词库</Text>

      {SOURCES.map((src) => {
        const active = settings.sources.includes(src.value);
        const info = TEXTBOOK_INFO[src.value];
        if (!info) return null;

        return (
          <Pressable
            key={src.value}
            onPress={() => toggleSource(src.value)}
            style={[s.bookCard, active && s.bookCardActive]}
          >
            {/* Book cover */}
            <View style={[s.bookCover, { backgroundColor: info.coverColor }]}>
              <View style={[s.coverStrip, { backgroundColor: info.coverAccent }]} />
              <Text style={s.coverTitle} numberOfLines={3}>{info.coverText}</Text>
              {info.isbn ? <Text style={s.coverIsbn}>ISBN {info.isbn}</Text> : null}
            </View>

            {/* Book info */}
            <View style={s.bookInfo}>
              <View style={s.bookTitleRow}>
                <Text style={[s.bookTitle, active && { color: info.coverColor }]}>{src.label}</Text>
                {active && <View style={[s.selectedBadge, { backgroundColor: info.coverAccent }]}>
                  <Text style={s.badgeText}>✓ 已选</Text>
                </View>}
              </View>
              {info.titleJP ? <Text style={s.bookJP}>{info.titleJP}</Text> : null}
              <Text style={s.bookDesc} numberOfLines={2}>{info.description}</Text>
              <View style={s.bookMetaRow}>
                <Text style={s.metaLabel}>出版</Text>
                <Text style={s.metaValue}>{info.publisher}</Text>
              </View>
              <View style={s.bookMetaRow}>
                <Text style={s.metaLabel}>词量</Text>
                <Text style={s.metaValue}>{info.totalWords.toLocaleString()} 词</Text>
              </View>
              <View style={s.bookMetaRow}>
                <Text style={s.metaLabel}>难度</Text>
                <Text style={[s.metaValue, { color: info.coverColor }]}>{info.levels}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* JLPT 等级 */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>JLPT 难度等级</Text>
        <Text style={s.sectionHintSmall}>仅在选择 JLPT 词库时按等级过滤</Text>
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
                  {level.label}
                </Text>
                <Text style={[s.chipDesc, active && s.chipDescActive]}>{level.description}</Text>
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
            <Text style={s.switchDesc}>点击单词旁的按钮播放日语发音</Text>
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

      <Text style={s.version}>wordJP v1.2 · 16,757 词</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  // Section header (outside card)
  sectionHeader: {
    fontSize: 14, fontWeight: "500", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: 1,
    paddingHorizontal: 16, marginTop: 16, marginBottom: 4,
  },
  sectionHint: { fontSize: 12, color: "#cbd5e1", paddingHorizontal: 16, marginBottom: 8 },
  section: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9",
  },
  sectionTitle: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  sectionHintSmall: { fontSize: 12, color: "#cbd5e1", marginBottom: 12 },

  // ---- Book card ----
  bookCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
    overflow: "hidden",
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
  // Realistic book cover
  bookCover: {
    width: 80,
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    position: "relative",
  },
  coverStrip: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 6,
  },
  coverTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },
  coverIsbn: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 7,
    marginTop: 6,
    textAlign: "center",
  },

  // Book info
  bookInfo: { flex: 1, padding: 14 },
  bookTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bookTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  selectedBadge: {
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  bookJP: { fontSize: 11, color: "#94a3b8", marginTop: 1, marginBottom: 4 },
  bookDesc: { fontSize: 12, color: "#64748b", lineHeight: 17, marginBottom: 6 },
  bookMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  metaLabel: { fontSize: 11, color: "#94a3b8", width: 32 },
  metaValue: { fontSize: 11, color: "#475569", fontWeight: "500", flex: 1 },

  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: "#e2e8f0", flexDirection: "row", alignItems: "center", gap: 4,
  },
  chipActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  chipText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  chipTextActive: { color: "#2563eb" },
  chipDesc: { fontSize: 11, fontWeight: "400", color: "#94a3b8" },
  chipDescActive: { color: "#60a5fa" },

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
