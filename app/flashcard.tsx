import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { useFocusEffect } from "expo-router";
import { getDatabase } from "../src/db/client";
import { words, userProgress } from "../src/db/client";
import { useCollectionStore } from "../src/stores/collectionStore";
import { useSettingsStore } from "../src/stores/settingsStore";
import { speakJapanese } from "../src/services/tts";
import type { Word } from "../src/types";

export default function FlashcardScreen() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [wordStats, setWordStats] = useState<Record<number, { correct: number; wrong: number }>>({});
  const { isFavorite, addFavorite, removeFavorite } = useCollectionStore();
  const settings = useSettingsStore((s) => s.settings);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      try {
        const { db } = getDatabase();
        let ws = db.select().from(words).all();
        // Filter by selected sources & levels
        if (settings.sources?.length) {
          ws = ws.filter((w: any) => {
            const tags = (w.source || "").split(",");
            return settings.sources!.some((s: string) => tags.includes(s));
          });
        }
        if (settings.jlptLevels?.length) {
          ws = ws.filter((w: any) => {
            if (w.jlpt_level == null) return true;
            return settings.jlptLevels!.includes(w.jlpt_level);
          });
        }
        // Shuffle
        const shuffled = [...ws].sort(() => Math.random() - 0.5);
        setAllWords(shuffled);
        setIndex(0);
        setLoaded(true);

        // Load per-word stats
        const progress = db.select().from(userProgress).all();
        const st: Record<number, { correct: number; wrong: number }> = {};
        for (const p of progress) {
          if (!st[p.word_id]) st[p.word_id] = { correct: 0, wrong: 0 };
          st[p.word_id].correct += p.correct_count || 0;
          st[p.word_id].wrong += p.wrong_count || 0;
        }
        setWordStats(st);
      } catch { setLoaded(true); }
    }, [settings])
  );

  const word = allWords[index];
  const fav = word ? isFavorite(word.id) : false;
  const st = word ? (wordStats[word.id] || { correct: 0, wrong: 0 }) : { correct: 0, wrong: 0 };

  const prevWord = () => { if (allWords.length > 0) setIndex((index - 1 + allWords.length) % allWords.length); };
  const nextWord = () => { if (allWords.length > 0) setIndex((index + 1) % allWords.length); };
  const randomWord = () => { if (allWords.length > 0) setIndex(Math.floor(Math.random() * allWords.length)); };

  if (!loaded || allWords.length === 0) {
    return (
      <View style={s.empty}><Text style={s.emptyText}>加载中...</Text></View>
    );
  }

  return (
    <View style={s.container}>
      {/* Progress */}
      <View style={s.progressRow}>
        <Text style={s.progressText}>{index + 1} / {allWords.length}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Word card */}
        <View style={s.card}>
          <View style={s.cardBadges}>
            {word.jlpt_level ? <Text style={s.badge}>N{word.jlpt_level}</Text> : null}
            {word.part_of_speech ? <Text style={s.badge}>{word.part_of_speech}</Text> : null}
          </View>
          {/* Stats + Favorite row */}
          <View style={s.favoriteRow}>
            <Text style={[s.badge, { color: "#16a34a" }]}>✅{st.correct}</Text>
            <Text style={[s.badge, { color: "#ef4444" }]}>❌{st.wrong}</Text>
            <Pressable onPress={() => fav ? removeFavorite(word.id) : addFavorite(word)} style={[s.favBtn, fav && s.favActive]}>
              <Text style={s.favText}>{fav ? "⭐" : "☆"}</Text>
            </Pressable>
          </View>

          {/* Kanji */}
          <Text style={s.kanji}>{word.japanese}</Text>
          {/* Reading + audio */}
          <View style={s.readingRow}>
            <Text style={s.kana}>{word.reading}</Text>
            <Pressable onPress={() => speakJapanese(word.reading || word.japanese)} style={s.audioBtn}>
              <Text style={s.audioText}>🔊</Text>
            </Pressable>
          </View>
          {/* Meaning */}
          <Text style={s.meaning}>{word.chinese_meaning}</Text>

          {/* Stats moved to card header badges */}
        </View>
      </ScrollView>

      {/* Controls */}
      <View style={s.controls}>
        <Pressable onPress={prevWord} style={s.ctrlBtn}>
          <Text style={s.ctrlText}>⬅ 上一个</Text>
        </Pressable>
        <Pressable onPress={randomWord} style={[s.ctrlBtn, s.randomBtn]}>
          <Text style={s.ctrlText}>🎲 随机</Text>
        </Pressable>
        <Pressable onPress={nextWord} style={[s.ctrlBtn, s.nextBtn]}>
          <Text style={[s.ctrlText, { color: "#fff" }]}>下一个 ➡</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  emptyText: { color: "#94a3b8", fontSize: 16 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10 },
  progressText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  scroll: { flex: 1 },
  card: {
    backgroundColor: "#ffffff", marginHorizontal: 20, marginTop: 8, borderRadius: 20,
    padding: 28, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardBadges: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-start", marginBottom: 12 },
  favoriteRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "flex-end", width: "100%", marginBottom: 8 },
  badge: { fontSize: 12, color: "#64748b", backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, fontWeight: "500" },
  favBtn: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, backgroundColor: "#f1f5f9" },
  favActive: { backgroundColor: "#fef9c3" },
  favText: { fontSize: 18 },
  kanji: { fontSize: 40, fontWeight: "700", color: "#1e293b", textAlign: "center", marginBottom: 10 },
  readingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  kana: { fontSize: 22, color: "#64748b" },
  audioBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  audioText: { fontSize: 20 },
  meaning: { fontSize: 22, fontWeight: "600", color: "#2563eb", textAlign: "center", marginBottom: 16 },
  controls: {
    flexDirection: "row", paddingHorizontal: 20, paddingVertical: 14, gap: 10,
    backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#e2e8f0",
  },
  ctrlBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  ctrlText: { fontSize: 15, fontWeight: "600", color: "#475569" },
  randomBtn: { backgroundColor: "#f1f5f9" },
  nextBtn: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
});
