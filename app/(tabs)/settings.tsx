import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Switch, TextInput, StyleSheet, Platform } from "react-native";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { useLibraryStore, type CustomLibrary } from "../../src/stores/libraryStore";
import { QUESTION_COUNT_OPTIONS, SOURCES, TEXTBOOK_INFO } from "../../src/constants";

export default function SettingsScreen() {
  const { settings, updateSettings, resetToDefaults } = useSettingsStore();
  const { libraries, load, create, remove, rename, toggle, importCSV, exportCSV } = useLibraryStore();
  const [newName, setNewName] = useState("");

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    const n = newName.trim();
    if (!n) return;
    create(n);
    setNewName("");
  };

  const handleImportCSV = (key: string) => {
    // Use hidden file input — works on web, native uses expo-document-picker
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev: any) => {
          const text = ev.target?.result || "";
          const count = importCSV(key, text);
          // Alert doesn't work well in RN Web, so we need a different approach
          window.alert(`导入完成：${count} 个单词已添加到词库`);
          load(); // refresh
        };
        reader.readAsText(file, "utf-8");
      };
      input.click();
    }
  };

  const handleExportCSV = (key: string) => {
    const csv = exportCSV(key);
    if (!csv) return;
    if (Platform.OS === "web") {
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = (key: string) => {
    if (Platform.OS === "web" && !window.confirm("确定要删除这个词库吗？")) return;
    remove(key);
    // Also remove from settings sources if present
    if (settings.sources.includes(key)) {
      updateSettings({ sources: settings.sources.filter((s) => s !== key) });
    }
  };

  const libEntries = Object.values(libraries);

  return (
    <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 内置教材 */}
      <Text style={st.sectionHeader}>内置教材</Text>
      <Text style={st.sectionHint}>点击教材卡片选择或取消词库</Text>
      {SOURCES.map((src) => {
        const active = settings.sources.includes(src.value);
        const info = TEXTBOOK_INFO[src.value];
        if (!info) return null;
        return (
          <Pressable
            key={src.value}
            onPress={() => {
              const up = settings.sources.includes(src.value)
                ? settings.sources.filter((s) => s !== src.value)
                : [...settings.sources, src.value];
              if (up.length > 0) updateSettings({ sources: up });
            }}
            style={[st.bookCard, active && st.bookCardActive]}
          >
            <View style={[st.bookCover, { backgroundColor: info.coverColor }]}>
              <View style={[st.coverStrip, { backgroundColor: info.coverAccent }]} />
              <Text style={st.coverTitle} numberOfLines={3}>{info.coverText}</Text>
            </View>
            <View style={st.bookInfo}>
              <Text style={[st.bookTitle, active && { color: info.coverColor }]}>{src.label}</Text>
              <Text style={st.bookJP}>{info.titleJP}</Text>
              <Text style={st.bookDesc} numberOfLines={2}>{info.description}</Text>
              <Text style={st.bookLevels}>{info.totalWords.toLocaleString()} 词 · {info.levels}</Text>
              {active && <View style={st.checkBadge}><Text style={st.checkText}>✓ 已选</Text></View>}
            </View>
          </Pressable>
        );
      })}

      {/* 自定义词库 */}
      <Text style={[st.sectionHeader, { marginTop: 24 }]}>自定义词库</Text>
      <View style={{ paddingHorizontal: 16 }}>
        <View style={st.inputRow}>
          <TextInput
            style={st.input}
            placeholder="输入新词库名称..."
            placeholderTextColor="#94a3b8"
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleCreate}
          />
          <Pressable onPress={handleCreate} style={st.createBtn}>
            <Text style={st.createBtnText}>创建</Text>
          </Pressable>
        </View>
      </View>

      {libEntries.length === 0 ? (
        <Text style={st.emptyText}>暂无自定义词库，在上方创建</Text>
      ) : (
        libEntries.map((lib) => {
          const active = settings.sources.includes(lib.key);
          return (
            <View key={lib.key} style={st.libCard}>
              {/* Header */}
              <View style={st.libHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={st.libName}>{lib.name}</Text>
                  <Text style={st.libCount}>
                    {lib.words.length} 词 · {lib.enabled ? "已启用" : "未启用"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    const up = active
                      ? settings.sources.filter((s) => s !== lib.key)
                      : [...settings.sources, lib.key];
                    updateSettings({ sources: up });
                  }}
                  style={[st.enableBtn, active && st.enableBtnActive]}
                >
                  <Text style={[st.enableText, active && st.enableTextActive]}>
                    {active ? "已选" : "选择"}
                  </Text>
                </Pressable>
              </View>

              {/* Actions */}
              <View style={st.libActions}>
                <Pressable onPress={() => handleImportCSV(lib.key)} style={st.libAction}>
                  <Text>📥</Text><Text style={st.libActionText}>导入</Text>
                </Pressable>
                <Pressable onPress={() => handleExportCSV(lib.key)} style={st.libAction}>
                  <Text>📤</Text><Text style={st.libActionText}>导出</Text>
                </Pressable>
                <Pressable onPress={() => { const nn = window.prompt("新名称:", lib.name); if (nn) rename(lib.key, nn); }} style={st.libAction}>
                  <Text>✏️</Text><Text style={st.libActionText}>改名</Text>
                </Pressable>
                <Pressable onPress={() => toggle(lib.key)} style={st.libAction}>
                  <Text>🔄</Text><Text style={st.libActionText}>{lib.enabled ? "禁用" : "启用"}</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(lib.key)} style={st.libAction}>
                  <Text>🗑️</Text><Text style={[st.libActionText, { color: "#ef4444" }]}>删除</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

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
            <Text style={st.switchDesc}>点击单词旁按钮播放日语发音</Text>
          </View>
          <Switch value={settings.soundEnabled} onValueChange={(v) => updateSettings({ soundEnabled: v })}
            trackColor={{ false: "#e2e8f0", true: "#93c5fd" }} thumbColor={settings.soundEnabled ? "#2563eb" : "#f1f5f9"} />
        </View>
      </View>

      <Pressable onPress={resetToDefaults} style={st.resetBtn}>
        <Text style={st.resetText}>恢复默认设置</Text>
      </Pressable>
      <Text style={st.version}>wordJP v2.1</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  sectionHeader: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: "#cbd5e1", paddingHorizontal: 16, marginBottom: 8 },
  section: { backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" },
  sectionTitle: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  // Book cards
  bookCard: { flexDirection: "row", marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#fafafa", overflow: "hidden" },
  bookCardActive: { borderColor: "#93c5fd", backgroundColor: "#fafbff" },
  bookCover: { width: 68, minHeight: 100, alignItems: "center", justifyContent: "center", padding: 6 },
  coverStrip: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  coverTitle: { color: "#ffffff", fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 13 },
  bookInfo: { flex: 1, padding: 12 },
  bookTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  bookJP: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  bookDesc: { fontSize: 11, color: "#64748b", lineHeight: 16, marginVertical: 4 },
  bookLevels: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  checkBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "#eff6ff", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  checkText: { fontSize: 10, fontWeight: "700", color: "#2563eb" },
  // Custom library
  inputRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: { flex: 1, backgroundColor: "#ffffff", borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: "#e2e8f0", color: "#1e293b" },
  createBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  createBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  emptyText: { fontSize: 13, color: "#cbd5e1", textAlign: "center", paddingVertical: 20 },
  libCard: { backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" },
  libHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  libName: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  libCount: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  enableBtn: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  enableBtnActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  enableText: { fontSize: 13, fontWeight: "500", color: "#64748b" },
  enableTextActive: { color: "#2563eb" },
  libActions: { flexDirection: "row", gap: 2, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10 },
  libAction: { flex: 1, alignItems: "center", paddingVertical: 4 },
  libActionText: { fontSize: 10, color: "#64748b", marginTop: 2, fontWeight: "500" },
  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  countChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  countChipActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  countText: { fontWeight: "500", color: "#64748b" },
  countTextActive: { color: "#2563eb" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  switchDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  resetBtn: { marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 16, alignItems: "center", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#f1f5f9" },
  resetText: { color: "#f87171", fontWeight: "500" },
  version: { textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 24 },
});
