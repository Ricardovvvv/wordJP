import { useEffect } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useCollectionStore } from "../../src/stores/collectionStore";
import { speakJapanese } from "../../src/services/tts";

export default function CollectionScreen() {
  const { favorites, removeFavorite, wrongAnswers, removeWrong, loadFromStorage } =
    useCollectionStore();

  useEffect(() => { loadFromStorage(); }, []);

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Favorites */}
      <Text style={s.sectionTitle}>⭐ 收藏夹 ({favorites.length})</Text>
      {favorites.length === 0 ? (
        <Text style={s.empty}>暂无收藏单词，在刷题时点击⭐即可收藏</Text>
      ) : (
        favorites.map((fav) => (
          <View key={fav.word.id} style={s.card}>
            <View style={s.cardMain}>
              <View style={{ flex: 1 }}>
                <View style={s.cardHeader}>
                  <Text style={s.jp}>{fav.word.japanese}</Text>
                  <Text style={s.reading}>{fav.word.reading}</Text>
                  <Pressable onPress={() => speakJapanese(fav.word.japanese)} style={s.audioBtn}>
                    <Text>🔈</Text>
                  </Pressable>
                </View>
                <Text style={s.meaning}>{fav.word.chinese_meaning}</Text>
              </View>
              <Pressable onPress={() => removeFavorite(fav.word.id)} style={s.removeBtn}>
                <Text style={s.removeText}>取消收藏</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {/* Wrong Answers */}
      <Text style={[s.sectionTitle, { marginTop: 24 }]}>❌ 错题本 ({wrongAnswers.length})</Text>
      {wrongAnswers.length === 0 ? (
        <Text style={s.empty}>暂无错题，答题出错后自动加入此处</Text>
      ) : (
        wrongAnswers.map((w) => (
          <View key={w.word.id} style={[s.card, s.wrongCard]}>
            <View style={s.cardMain}>
              <View style={{ flex: 1 }}>
                <View style={s.cardHeader}>
                  <Text style={s.jp}>{w.word.japanese}</Text>
                  <Text style={s.reading}>{w.word.reading}</Text>
                  <Pressable onPress={() => speakJapanese(w.word.japanese)} style={s.audioBtn}>
                    <Text>🔈</Text>
                  </Pressable>
                </View>
                <Text style={s.meaning}>{w.word.chinese_meaning}</Text>
                <Text style={s.wrongCount}>答错 {w.wrongCount} 次</Text>
              </View>
              <Pressable onPress={() => removeWrong(w.word.id)} style={[s.removeBtn, s.clearBtn]}>
                <Text style={[s.removeText, { color: "#16a34a" }]}>清除</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  empty: { fontSize: 14, color: "#94a3b8", marginHorizontal: 16, marginTop: 8 },
  card: { backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" },
  wrongCard: { borderLeftWidth: 3, borderLeftColor: "#ef4444" },
  cardMain: { flexDirection: "row", alignItems: "center" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  jp: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  reading: { fontSize: 13, color: "#94a3b8" },
  audioBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  meaning: { fontSize: 15, color: "#475569", marginTop: 4 },
  wrongCount: { fontSize: 11, color: "#ef4444", marginTop: 2 },
  removeBtn: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  removeText: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  clearBtn: { borderColor: "#bbf7d0" },
});
