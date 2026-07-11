import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { GOJUON } from "../../src/data/gojuon";
import { speakJapanese } from "../../src/services/tts";

const TABS = ["清音", "浊音·半浊音", "拗音"] as const;
type Tab = typeof TABS[number];

export default function GojuonScreen() {
  const [tab, setTab] = useState<Tab>("清音");

  const key: "seion" | "dakuon" | "youon" =
    tab === "清音" ? "seion" : tab === "浊音·半浊音" ? "dakuon" : "youon";
  const grid = GOJUON[key];

  // Row headers for seion
  const headers = ["a", "i", "u", "e", "o"];

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Tab bar */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {/* Column headers */}
      <View style={s.headerRow}>
        <View style={s.emptyCell} />
        {headers.map((h) => (
          <View key={h} style={s.headerCell}><Text style={s.headerText}>{h}</Text></View>
        ))}
      </View>

      {/* Grid */}
      {grid.map((row, ri) => (
        <View key={ri} style={s.gridRow}>
          <View style={s.rowLabel}>
            <Text style={s.rowLabelText}>{row[0]?.romaji[0] || ""}</Text>
          </View>
          {row.map((cell, ci) =>
            cell ? (
              <Pressable key={ci} style={s.cell} onPress={() => speakJapanese(cell.hiragana)}>
                <Text style={s.hiragana}>{cell.hiragana}</Text>
                <Text style={s.katakana}>{cell.katakana}</Text>
                <Text style={s.romaji}>{cell.romaji}</Text>
              </Pressable>
            ) : (
              <View key={ci} style={s.emptyCell} />
            )
          )}
        </View>
      ))}

      <Text style={s.hint}>点击假名可听发音</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, marginBottom: 8, gap: 4, backgroundColor: "#f1f5f9", borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#ffffff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 14, fontWeight: "500", color: "#64748b" },
  tabTextActive: { color: "#2563eb", fontWeight: "700" },
  // Grid
  headerRow: { flexDirection: "row", marginHorizontal: 12, marginBottom: 2 },
  headerCell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  headerText: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
  gridRow: { flexDirection: "row", marginHorizontal: 12 },
  rowLabel: { width: 32, alignItems: "center", justifyContent: "center" },
  rowLabelText: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  cell: {
    flex: 1, backgroundColor: "#ffffff", margin: 1.5, borderRadius: 8, paddingVertical: 8,
    alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9",
  },
  hiragana: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  katakana: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  romaji: { fontSize: 10, color: "#94a3b8", marginTop: 1 },
  emptyCell: { flex: 1, margin: 1.5 },
  hint: { textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 16 },
});
