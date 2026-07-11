import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Switch, TextInput, StyleSheet, Platform } from "react-native";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { useLibraryStore } from "../../src/stores/libraryStore";
import { QUESTION_COUNT_OPTIONS, SOURCES, TEXTBOOK_INFO } from "../../src/constants";

export default function SettingsScreen() {
  const { settings, updateSettings, resetToDefaults } = useSettingsStore();
  const { libraries, load, create, remove, rename, importCSV, exportCSV } = useLibraryStore();
  const [newName, setNewName] = useState("");
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [bookNotes, setBookNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
    try {
      const saved = localStorage.getItem("wordjp_book_notes");
      if (saved) setBookNotes(JSON.parse(saved));
    } catch {}
  }, []);

  const saveNotes = (notes: Record<string, string>) => {
    setBookNotes(notes);
    try { localStorage.setItem("wordjp_book_notes", JSON.stringify(notes)); } catch {}
  };

  const handleCreate = () => {
    const n = newName.trim();
    if (!n) return;
    create(n);
    setNewName("");
  };

  const pickFile = (): Promise<string> => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) { resolve(""); return; }
        const reader = new FileReader();
        reader.onload = (ev: any) => resolve(ev.target?.result || "");
        reader.readAsText(file, "utf-8");
      };
      input.click();
    });
  };

  const handleImportCSV = async (key: string) => {
    if (Platform.OS !== "web") return;
    const text = await pickFile();
    if (!text) return;
    const count = importCSV(key, text);
    window.alert(`导入完成：${count} 个单词`);
    load();
  };

  const handleExportCSV = (key: string) => {
    const csv = exportCSV(key);
    if (!csv) return;
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${key}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteLib = (key: string) => {
    if (!window.confirm("确定要删除这个词库吗？")) return;
    remove(key);
    if (settings.sources.includes(key)) {
      updateSettings({ sources: settings.sources.filter((s) => s !== key) });
    }
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 内置教材 */}
      <Text style={st.sectionHeader}>内置教材</Text>
      {SOURCES.map((src) => {
        const info = TEXTBOOK_INFO[src.value];
        if (!info) return null;
        const expanded = expandedBook === src.value;
        const note = bookNotes[src.value] || "";

        return (
          <View key={src.value} style={st.bookCard}>
            {/* Title row — tap to expand */}
            <Pressable onPress={() => setExpandedBook(expanded ? null : src.value)} style={st.bookHeader}>
              <View style={[st.bookCover, { backgroundColor: info.coverColor }]}>
                <View style={[st.coverStrip, { backgroundColor: info.coverAccent }]} />
                <Text style={st.coverTitle} numberOfLines={3}>{info.coverText}</Text>
              </View>
              <View style={st.bookHeaderInfo}>
                <Text style={st.bookTitle}>{src.label}</Text>
                <Text style={st.bookJP}>{info.titleJP}</Text>
                <Text style={st.bookMeta}>
                  {info.totalWords.toLocaleString()} 词 · {info.levels} · {info.totalLessons > 0 ? `${info.totalLessons}课` : `${info.publisher}`}
                </Text>
              </View>
              <Text style={st.chevron}>{expanded ? "▲" : "▼"}</Text>
            </Pressable>

            {/* Expanded detail */}
            {expanded && (
              <View style={st.bookDetail}>
                <Text style={st.detailDesc}>{info.description}</Text>

                <View style={st.detailMetaGrid}>
                  <View style={st.detailMeta}>
                    <Text style={st.detailLabel}>出版社</Text>
                    <Text style={st.detailValue}>{info.publisher}</Text>
                  </View>
                  <View style={st.detailMeta}>
                    <Text style={st.detailLabel}>作者</Text>
                    <Text style={st.detailValue}>{info.author}</Text>
                  </View>
                  <View style={st.detailMeta}>
                    <Text style={st.detailLabel}>词汇量</Text>
                    <Text style={st.detailValue}>{info.totalWords.toLocaleString()} 词</Text>
                  </View>
                  <View style={st.detailMeta}>
                    <Text style={st.detailLabel}>难度</Text>
                    <Text style={st.detailValue}>{info.levels}</Text>
                  </View>
                </View>

                {/* Notes */}
                <Text style={st.detailLabel}>备注</Text>
                <TextInput
                  style={st.noteInput}
                  placeholder="添加你的备注..."
                  placeholderTextColor="#cbd5e1"
                  value={note}
                  onChangeText={(text) => saveNotes({ ...bookNotes, [src.value]: text })}
                  multiline
                />

                {/* Actions */}
                <View style={st.detailActions}>
                  <Pressable onPress={() => handleExportCSV(src.value)} style={st.detailAction}>
                    <Text style={st.detailActionText}>📤 导出词库</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* 自定义词库 */}
      <Text style={[st.sectionHeader, { marginTop: 24 }]}>自定义词库</Text>
      <View style={{ paddingHorizontal: 16 }}>
        <View style={st.inputRow}>
          <TextInput style={st.input} placeholder="输入新词库名称..." placeholderTextColor="#94a3b8"
            value={newName} onChangeText={setNewName} onSubmitEditing={handleCreate} />
          <Pressable onPress={handleCreate} style={st.createBtn}>
            <Text style={st.createBtnText}>创建</Text>
          </Pressable>
        </View>
      </View>

      {Object.keys(libraries).length === 0 ? (
        <Text style={st.emptyText}>暂无自定义词库，在上方创建</Text>
      ) : (
        Object.values(libraries).map((lib) => (
          <View key={lib.key} style={st.libCard}>
            <View style={st.libHeader}>
              <View style={{ flex: 1 }}>
                <Text style={st.libName}>{lib.name}</Text>
                <Text style={st.libCount}>{lib.words.length} 词</Text>
              </View>
            </View>
            <View style={st.libActions}>
              <Pressable onPress={() => handleImportCSV(lib.key)} style={st.libAction}>
                <Text style={st.libActionIcon}>📥</Text><Text style={st.libActionText}>导入</Text>
              </Pressable>
              <Pressable onPress={() => handleExportCSV(lib.key)} style={st.libAction}>
                <Text style={st.libActionIcon}>📤</Text><Text style={st.libActionText}>导出</Text>
              </Pressable>
              <Pressable onPress={() => { const nn = window.prompt("新名称:", lib.name); if (nn) rename(lib.key, nn); }} style={st.libAction}>
                <Text style={st.libActionIcon}>✏️</Text><Text style={st.libActionText}>改名</Text>
              </Pressable>
              <Pressable onPress={() => handleDeleteLib(lib.key)} style={st.libAction}>
                <Text style={st.libActionIcon}>🗑️</Text><Text style={[st.libActionText, { color: "#ef4444" }]}>删除</Text>
              </Pressable>
            </View>
          </View>
        ))
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
  sectionHeader: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  section: { backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#f1f5f9" },
  sectionTitle: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },

  // ---- Book cards (collapsed + expanded) ----
  bookCard: { backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden" },
  bookHeader: { flexDirection: "row", alignItems: "center", padding: 10 },
  bookCover: { width: 62, height: 82, alignItems: "center", justifyContent: "center", padding: 5, borderRadius: 8, overflow: "hidden" },
  coverStrip: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  coverTitle: { color: "#ffffff", fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 12 },
  bookHeaderInfo: { flex: 1, marginLeft: 12 },
  bookTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  bookJP: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  bookMeta: { fontSize: 11, color: "#64748b", marginTop: 4 },
  chevron: { fontSize: 12, color: "#94a3b8", paddingHorizontal: 4 },

  // Expanded detail
  bookDetail: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  detailDesc: { fontSize: 13, color: "#475569", lineHeight: 19, marginTop: 10, marginBottom: 12 },
  detailMetaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  detailMeta: { width: "50%", marginBottom: 8 },
  detailLabel: { fontSize: 11, color: "#94a3b8", marginBottom: 2 },
  detailValue: { fontSize: 13, color: "#1e293b", fontWeight: "500" },
  noteInput: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, fontSize: 13, borderWidth: 1, borderColor: "#e2e8f0", color: "#1e293b", minHeight: 60, textAlignVertical: "top", marginBottom: 10 },
  detailActions: { flexDirection: "row", gap: 8 },
  detailAction: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  detailActionText: { fontSize: 13, fontWeight: "600", color: "#475569" },

  // ---- Custom library ----
  inputRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: { flex: 1, backgroundColor: "#ffffff", borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: "#e2e8f0", color: "#1e293b" },
  createBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  createBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  emptyText: { fontSize: 13, color: "#cbd5e1", textAlign: "center", paddingVertical: 20 },
  libCard: { backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" },
  libHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  libName: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  libCount: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  libActions: { flexDirection: "row", gap: 2, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10 },
  libAction: { flex: 1, alignItems: "center", paddingVertical: 4 },
  libActionIcon: { fontSize: 16 },
  libActionText: { fontSize: 10, color: "#64748b", marginTop: 2, fontWeight: "500" },

  // ---- Chips ----
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  countChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  countChipActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  countText: { fontWeight: "500", color: "#64748b" },
  countTextActive: { color: "#2563eb" },

  // ---- Switch ----
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  switchDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  // ---- Reset ----
  resetBtn: { marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 16, alignItems: "center", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#f1f5f9" },
  resetText: { color: "#f87171", fontWeight: "500" },
  version: { textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 24 },
});
