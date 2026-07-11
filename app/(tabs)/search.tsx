import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { getDatabase } from "../../src/db/client";
import { words, userProgress } from "../../src/db/client";
import { speakJapanese } from "../../src/services/tts";
import { useFocusEffect } from "expo-router";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"local" | "online">("local");
  const [results, setResults] = useState<any[]>([]);
  const [allWords, setAllWords] = useState<any[]>([]);
  const [wordStats, setWordStats] = useState<Record<number, { correct: number; wrong: number }>>({});

  useFocusEffect(
    useCallback(() => {
      try {
        const { db } = getDatabase();
        const ws = db.select().from(words).all();
        setAllWords(ws);
        // Per-word stats
        const progress = db.select().from(userProgress).all();
        const stats: Record<number, { correct: number; wrong: number }> = {};
        for (const p of progress) {
          if (!stats[p.word_id]) stats[p.word_id] = { correct: 0, wrong: 0 };
          stats[p.word_id].correct += p.correct_count || 0;
          stats[p.word_id].wrong += p.wrong_count || 0;
        }
        setWordStats(stats);
      } catch {}
    }, [])
  );

  const doLocalSearch = (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const kw = q.toLowerCase();
    const matches = allWords
      .filter((w: any) =>
        (w.japanese || "").toLowerCase().includes(kw) ||
        (w.reading || "").toLowerCase().includes(kw) ||
        (w.chinese_meaning || "").toLowerCase().includes(kw)
      )
      .slice(0, 50);
    setResults(matches);
  };

  // Same translation approach as PWA project:
  // MyMemory API for ja↔zh, Jisho for readings, Tatoeba for examples
  const doOnlineSearch = async (q: string) => {
    if (!q.trim()) return;
    setResults([{ type: "loading" }]);
    try {
      // Use same kana detection as PWA project
      const isJP = /[぀-ヿㇰ-ㇿ]/.test(q);
      const langPair = isJP ? "ja|zh" : "zh|ja";
      const transUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${langPair}`;
      const transRes = await fetch(transUrl);
      const transData = await transRes.json();
      const translated = transData?.responseData?.translatedText || "翻译失败";

      let readingText = "";
      let examples: { ja: string; zh: string }[] = [];

      // If Japanese input, get readings from Jisho
      if (isJP) {
        try {
          const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(q)}`;
          const jishoRes = await fetch(jishoUrl);
          const jishoData = await jishoRes.json();
          if (jishoData?.data?.length > 0) {
            const entry = jishoData.data[0];
            const kana = entry.japanese?.[0]?.reading || entry.japanese?.[0]?.word || "";
            if (kana) readingText = kana;
          }
        } catch {}

        // Get example sentences from Tatoeba
        if (q.length < 10) {
          try {
            const tatoebaUrl = `https://tatoeba.org/en/api_v1/search?from=jpn&to=cmn&query=${encodeURIComponent(q)}&trans_filter=limit&trans_to=cmn`;
            const tatoebaRes = await fetch(tatoebaUrl);
            const tatoebaData = await tatoebaRes.json();
            if (tatoebaData?.results?.length > 0) {
              examples = tatoebaData.results.slice(0, 3).map((r: any) => ({
                ja: r.text,
                zh: r.translations?.[0]?.[0]?.text || "",
              }));
            }
          } catch {}
        }
      }

      setResults([{
        type: "online",
        query: q,
        translated,
        isJP,
        reading: readingText,
        examples,
      }]);
    } catch {
      setResults([{ type: "error" }]);
    }
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    if (mode === "local") doLocalSearch(text);
  };

  const getStats = (wordId: number) => {
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
        <Pressable onPress={() => mode === "online" && doOnlineSearch(query)} style={s.searchBtn}>
          <Text style={s.searchBtnText}>{mode === "online" ? "翻译" : "🔍"}</Text>
        </Pressable>
      </View>

      <View style={s.toggleRow}>
        <Pressable onPress={() => { setMode("local"); doLocalSearch(query); }} style={[s.toggleBtn, mode === "local" && s.toggleActive]}>
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

        {/* Online result */}
        {results[0]?.type === "online" && (
          <View style={s.onlineCard}>
            <Text style={s.onlineTranslation}>{results[0].translated}</Text>
            {results[0].reading ? <Text style={s.onlineReading}>读音: {results[0].reading}</Text> : null}
            <Pressable
              onPress={() => speakJapanese(results[0].isJP ? results[0].query : results[0].translated)}
              style={s.playBtn}
            >
              <Text style={s.playBtnText}>🔊 播放</Text>
            </Pressable>
            {results[0].examples?.map((ex: any, i: number) => (
              <View key={i} style={s.exampleRow}>
                <Text style={s.exampleJa}>・{ex.ja}</Text>
                <Text style={s.exampleZh}>{ex.zh}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Local results */}
        {mode === "local" &&
          results.filter((r) => !r.type).map((word, i) => (
            <View key={i} style={s.wordCard}>
              <View style={s.wordHeader}>
                <Text style={s.wordJP}>{word.japanese}</Text>
                <Text style={s.wordReading}>{word.reading}</Text>
                <Pressable onPress={() => speakJapanese(word.japanese || word.reading)} style={s.audioBtn}>
                  <Text>🔊</Text>
                </Pressable>
              </View>
              <Text style={s.wordMeaning}>{word.chinese_meaning}</Text>
              <View style={s.metaRow}>
                {word.jlpt_level ? <Text style={s.tag}>N{word.jlpt_level}</Text> : null}
                {word.source ? <Text style={s.tag}>{word.source.split(",")[0]}</Text> : null}
                {getStats(word.id)}
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
  wordMeaning: { fontSize: 15, color: "#475569", marginTop: 6 },
  metaRow: { flexDirection: "row", gap: 6, marginTop: 6, alignItems: "center" },
  tag: { fontSize: 11, color: "#64748b", backgroundColor: "#f1f5f9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  statRow: { flexDirection: "row", gap: 6, marginLeft: "auto" },
  statCorrect: { fontSize: 11, color: "#16a34a", fontWeight: "600" },
  statWrong: { fontSize: 11, color: "#ef4444", fontWeight: "600" },
  onlineCard: { backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  onlineTranslation: { fontSize: 22, color: "#1e293b", fontWeight: "700", marginBottom: 8 },
  onlineReading: { fontSize: 13, color: "#94a3b8", marginBottom: 8 },
  playBtn: { alignSelf: "flex-start", backgroundColor: "#f1f5f9", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 12 },
  playBtnText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  exampleRow: { marginBottom: 6 },
  exampleJa: { fontSize: 13, color: "#475569", lineHeight: 19 },
  exampleZh: { fontSize: 12, color: "#94a3b8", marginTop: 2, paddingLeft: 12 },
});
