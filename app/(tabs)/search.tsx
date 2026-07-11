import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { getDatabase, eq } from "../../src/db/client";
import { words, userProgress } from "../../src/db/client";
import { speakJapanese } from "../../src/services/tts";
import { useFocusEffect } from "expo-router";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"local" | "online">("local");
  const [results, setResults] = useState<any[]>([]);
  const [allWords, setAllWords] = useState<any[]>([]);
  const [wordStats, setWordStats] = useState<Record<number, { correct: number; wrong: number }>>({});

  // Load on focus
  useFocusEffect(
    useCallback(() => {
      try {
        const { db } = getDatabase();
        setAllWords(db.select().from(words).all());
        // Load per-word stats
        const progress = db.select().from(userProgress).all();
        const stats: Record<number, { correct: number; wrong: number }> = {};
        for (const p of progress) {
          const wid = p.word_id;
          if (!stats[wid]) stats[wid] = { correct: 0, wrong: 0 };
          stats[wid].correct += p.correct_count || 0;
          stats[wid].wrong += p.wrong_count || 0;
        }
        setWordStats(stats);
      } catch {}
    }, [])
  );

  const doLocalSearch = (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const kw = q.toLowerCase();
    const matches = allWords
      .filter(
        (w: any) =>
          (w.japanese || "").toLowerCase().includes(kw) ||
          (w.reading || "").toLowerCase().includes(kw) ||
          (w.chinese_meaning || "").toLowerCase().includes(kw)
      )
      .slice(0, 50);
    setResults(matches);
  };

  const doOnlineSearch = async (q: string) => {
    if (!q.trim()) return;
    setResults([{ type: "loading" }]);
    try {
      const isJP = /[぀-ヿ一-鿿]/.test(q);
      // Google Translate (free, no key needed for web)
      const source = isJP ? "ja" : "zh-CN";
      const target = isJP ? "zh-CN" : "ja";
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(q)}`;
      const resp = await fetch(url);
      const data = await resp.json();
      // Google API returns [[["translated text", "original", ...]], ...]
      const translated = data?.[0]?.[0]?.[0] || data?.[0]?.map((x: any) => x[0]).join("") || "无结果";
      setResults([{ type: "online", query: q, translated, isJP }]);
    } catch {
      setResults([{ type: "error" }]);
    }
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    if (mode === "local") doLocalSearch(text);
  };

  const handleOnlineTrigger = () => {
    if (mode === "online") doOnlineSearch(query);
  };

  const getStatsDisplay = (wordId: number) => {
    const st = wordStats[wordId];
    if (!st || (st.correct === 0 && st.wrong === 0)) return null;
    return (
      <View style={s.statRow}>
        <Text style={s.statCorrect}>✓{st.correct}</Text>
        <Text style={s.statWrong}>✗{st.wrong}</Text>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <TextInput
          style={s.input}
          placeholder="输入日语或中文搜索..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={handleSearch}
          onSubmitEditing={() => mode === "online" && doOnlineSearch(query)}
          returnKeyType="search"
        />
        <Pressable onPress={handleOnlineTrigger} style={s.searchBtn}>
          <Text style={s.searchBtnText}>{mode === "online" ? "翻译" : "🔍"}</Text>
        </Pressable>
      </View>

      <View style={s.toggleRow}>
        <Pressable
          onPress={() => { setMode("local"); doLocalSearch(query); }}
          style={[s.toggleBtn, mode === "local" && s.toggleActive]}
        >
          <Text style={[s.toggleText, mode === "local" && s.toggleTextActive]}>词库</Text>
        </Pressable>
        <Pressable onPress={() => setMode("online")} style={[s.toggleBtn, mode === "online" && s.toggleActive]}>
          <Text style={[s.toggleText, mode === "online" && s.toggleTextActive]}>联网</Text>
        </Pressable>
      </View>

      <ScrollView style={s.results} contentContainerStyle={{ paddingBottom: 20 }}>
        {results.length === 0 && query && <Text style={s.empty}>未找到匹配项</Text>}
        {results.length === 0 && !query && <Text style={s.empty}>在上方输入单词开始搜索</Text>}
        {results[0]?.type === "loading" && <Text style={s.empty}>翻译中...</Text>}
        {results[0]?.type === "error" && <Text style={s.empty}>请求失败，请检查网络</Text>}
        {results[0]?.type === "online" && (
          <View style={s.onlineCard}>
            <Text style={s.onlineQuery}>{results[0].query}</Text>
            <Text style={s.onlineTranslation}>{results[0].translated}</Text>
          </View>
        )}
        {mode === "local" &&
          results.filter((r) => !r.type).map((word, i) => (
            <View key={i} style={s.wordCard}>
              <View style={s.wordHeader}>
                <Text style={s.wordJP}>{word.japanese}</Text>
                <Text style={s.wordReading}>{word.reading}</Text>
                <Pressable onPress={() => speakJapanese(word.japanese || word.reading)} style={s.audioBtn}>
                  <Text style={s.audioIcon}>🔈</Text>
                </Pressable>
              </View>
              <Text style={s.wordMeaning}>{word.chinese_meaning}</Text>
              <View style={s.metaRow}>
                {word.jlpt_level ? <Text style={s.tag}>N{word.jlpt_level}</Text> : null}
                {word.source ? <Text style={s.tag}>{word.source.split(",")[0]}</Text> : null}
                {getStatsDisplay(word.id)}
              </View>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  searchBar: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, gap: 8 },
  input: { flex: 1, backgroundColor: "#ffffff", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#e2e8f0", color: "#1e293b" },
  searchBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  searchBtnText: { color: "#ffffff", fontSize: 18, fontWeight: "600" },
  toggleRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 8, gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  toggleActive: { backgroundColor: "#eff6ff", borderColor: "#93c5fd" },
  toggleText: { fontSize: 13, fontWeight: "500", color: "#64748b" },
  toggleTextActive: { color: "#2563eb" },
  results: { flex: 1, marginTop: 8 },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 15 },
  wordCard: { backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" },
  wordHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordJP: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  wordReading: { fontSize: 14, color: "#94a3b8", flex: 1 },
  audioBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  audioIcon: { fontSize: 14 },
  wordMeaning: { fontSize: 15, color: "#475569", marginTop: 6 },
  metaRow: { flexDirection: "row", gap: 6, marginTop: 6, alignItems: "center" },
  tag: { fontSize: 11, color: "#64748b", backgroundColor: "#f1f5f9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  statRow: { flexDirection: "row", gap: 6, marginLeft: "auto" },
  statCorrect: { fontSize: 11, color: "#16a34a", fontWeight: "600" },
  statWrong: { fontSize: 11, color: "#ef4444", fontWeight: "600" },
  onlineCard: { backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  onlineQuery: { fontSize: 13, color: "#94a3b8" },
  onlineTranslation: { fontSize: 20, color: "#1e293b", fontWeight: "600", marginTop: 8 },
});
