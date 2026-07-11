import { View, Text, ScrollView, Pressable, Switch, TextInput, StyleSheet, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { QUESTION_COUNT_OPTIONS, SOURCES, TEXTBOOK_INFO } from "../../src/constants";
import { getDatabase } from "../../src/db/client";
import { words } from "../../src/db/client";

export default function SettingsScreen() {
  const { settings, updateSettings, resetToDefaults } = useSettingsStore();
  const [newLibName, setNewLibName] = useState("");

  // Create a new custom word library
  const handleCreateLibrary = () => {
    const name = newLibName.trim();
    if (!name) { Alert.alert("提示", "请输入词库名称"); return; }
    if (SOURCES.some((s) => s.value === name)) {
      Alert.alert("提示", "该词库名称已存在"); return;
    }
    // Add custom source to settings (dynamically)
    const updated = [...settings.sources, name.toLowerCase().replace(/\s+/g, "_")];
    updateSettings({ sources: updated });
    setNewLibName("");
    Alert.alert("成功", `已创建词库「${name}」。请在下方导入CSV文件。`);
  };

  // Placeholder for future CSV import
  const handleImportCSV = () => {
    Alert.alert("导入CSV", "请在电脑上选择CSV文件导入。CSV格式：日语单词,读音,中文释义,词性\n\n该功能将通过文件选择器实现。");
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 教材选择 */}
      <Text style={st.sectionHeader}>教材选择</Text>
      <Text style={st.sectionHint}>选择一本或多本教材作为练习词库</Text>
      {SOURCES.map((src) => {
        const active = settings.sources.includes(src.value);
        const info = TEXTBOOK_INFO[src.value];
        if (!info) return null;
        return (
          <Pressable key={src.value} onPress={() => {
            const updated = settings.sources.includes(src.value)
              ? settings.sources.filter((s) => s !== src.value)
              : [...settings.sources, src.value];
            if (updated.length > 0) updateSettings({ sources: updated });
          }} style={[st.bookCard, active && st.bookCardActive]}>
            <View style={[st.bookCover, { backgroundColor: info.coverColor }]}>
              <View style={[st.coverStrip, { backgroundColor: info.coverAccent }]} />
              <Text style={st.coverTitle} numberOfLines={3}>{info.coverText}</Text>
              {info.isbn ? <Text style={st.coverIsbn}>ISBN {info.isbn}</Text> : null}
            </View>
            <View style={st.bookInfo}>
              <View style={st.bookTitleRow}>
                <Text style={[st.bookTitle, active && { color: info.coverColor }]}>{src.label}</Text>
                {active && <View style={[st.selectedBadge, { backgroundColor: info.coverAccent }]}><Text style={st.badgeText}>✓</Text></View>}
              </View>
              {info.titleJP ? <Text style={st.bookJP}>{info.titleJP}</Text> : null}
              <Text style={st.bookDesc} numberOfLines={2}>{info.description}</Text>
              <View style={st.bookMetaRow}>
                <Text style={st.metaLabel}>出版</Text><Text style={st.metaValue}>{info.publisher}</Text>
              </View>
              <View style={st.bookMetaRow}>
                <Text style={st.metaLabel}>词量</Text><Text style={st.metaValue}>{info.totalWords.toLocaleString()} 词</Text>
              </View>
              <View style={st.bookMetaRow}>
                <Text style={st.metaLabel}>难度</Text><Text style={[st.metaValue, { color: info.coverColor }]}>{info.levels}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* 创建新词库 */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>创建新词库</Text>
        <Text style={st.inputHint}>输入名称创建自定义词库，然后导入CSV文件</Text>
        <View style={st.inputRow}>
          <TextInput
            style={st.input}
            placeholder="输入新词库名称"
            placeholderTextColor="#94a3b8"
            value={newLibName}
            onChangeText={setNewLibName}
          />
          <Pressable onPress={handleCreateLibrary} style={st.createBtn}>
            <Text style={st.createBtnText}>创建</Text>
          </Pressable>
        </View>
      </View>

      {/* CSV 导入 */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>导入词库</Text>
        <Text style={st.inputHint}>导入CSV格式的单词表。格式：日语单词,读音,中文释义</Text>
        <Pressable onPress={handleImportCSV} style={st.importBtn}>
          <Text style={st.importBtnText}>📥 选择CSV文件导入</Text>
        </Pressable>
      </View>

      {/* 每日题数 */}
      <View style={st.section}>
        <Text style={st.sectionTitle}>每日题目数量</Text>
        <View style={st.chipRow}>
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <Pressable key={count} onPress={() => updateSettings({ dailyGoal: count })}
              style={[st.countChip, settings.dailyGoal === count && st.countChipActive]}>
              <Text style={[st.countText, settings.dailyGoal === count && st.countTextActive]}>{count}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 发音 */}
      <View style={st.section}>
        <View style={st.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={st.switchLabel}>发音</Text>
            <Text style={st.switchDesc}>点击单词旁的按钮播放日语发音</Text>
          </View>
          <Switch value={settings.soundEnabled} onValueChange={(v) => updateSettings({ soundEnabled: v })}
            trackColor={{ false: "#e2e8f0", true: "#93c5fd" }} thumbColor={settings.soundEnabled ? "#2563eb" : "#f1f5f9"} />
        </View>
      </View>

      <Pressable onPress={resetToDefaults} style={st.resetBtn}>
        <Text style={st.resetText}>恢复默认设置</Text>
      </Pressable>
      <Text style={st.version}>wordJP v2.0 · 16,757 词</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  sectionHeader: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: "#cbd5e1", paddingHorizontal: 16, marginBottom: 8 },
  section: { backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" },
  sectionTitle: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  inputHint: { fontSize: 12, color: "#cbd5e1", marginBottom: 10 },
  // Input row
  inputRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: "#e2e8f0", color: "#1e293b" },
  createBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  createBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  importBtn: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#bbf7d0" },
  importBtnText: { color: "#16a34a", fontWeight: "700", fontSize: 15 },
  // Book cards
  bookCard: { flexDirection: "row", marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fafafa", overflow: "hidden" },
  bookCardActive: { borderColor: "#93c5fd", backgroundColor: "#fafbff", shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  bookCover: { width: 80, minHeight: 120, alignItems: "center", justifyContent: "center", padding: 8, position: "relative" },
  coverStrip: { position: "absolute", left: 0, top: 0, bottom: 0, width: 6 },
  coverTitle: { color: "#ffffff", fontSize: 11, fontWeight: "700", textAlign: "center", lineHeight: 14 },
  coverIsbn: { color: "rgba(255,255,255,0.5)", fontSize: 7, marginTop: 6, textAlign: "center" },
  bookInfo: { flex: 1, padding: 14 },
  bookTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bookTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  selectedBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  bookJP: { fontSize: 11, color: "#94a3b8", marginTop: 1, marginBottom: 4 },
  bookDesc: { fontSize: 12, color: "#64748b", lineHeight: 17, marginBottom: 6 },
  bookMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  metaLabel: { fontSize: 11, color: "#94a3b8", width: 32 },
  metaValue: { fontSize: 11, color: "#475569", fontWeight: "500", flex: 1 },
  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  countChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  countChipActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  countText: { fontWeight: "500", color: "#64748b" },
  countTextActive: { color: "#2563eb" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  switchDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  resetBtn: { backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9" },
  resetText: { color: "#f87171", fontWeight: "500" },
  version: { textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 24 },
});
