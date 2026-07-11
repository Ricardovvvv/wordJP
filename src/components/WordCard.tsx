import { View, Text, Pressable, StyleSheet } from "react-native";
import { AudioButton } from "./AudioButton";
import { useCollectionStore } from "../stores/collectionStore";
import type { QuizMode, Word } from "../types";
import { COLORS } from "../constants";

interface WordCardProps {
  word: Word;
  mode: QuizMode;
  showMeaning?: boolean;
  blind?: boolean;
}

export function WordCard({ word, mode, showMeaning = false, blind = false }: WordCardProps) {
  const { isFavorite, addFavorite, removeFavorite } = useCollectionStore();
  const fav = isFavorite(word.id);

  const isJpPrompt = mode === 1 || mode === 3;
  const isKanjiPrompt = mode === 5;
  const isKanaPrompt = mode === 6;
  const isKanaMode = isKanjiPrompt || isKanaPrompt;

  let label: string;
  let mainText: string;
  let hintText: string;
  let audioText: string;

  if (mode === 1) {
    label = "读音";
    mainText = blind ? "🔇 听读音选择" : word.reading;
    hintText = blind ? "" : word.japanese;
    audioText = word.reading;
  } else if (isKanjiPrompt) {
    label = "汉字";
    mainText = blind ? "🔇 听读音选择" : word.japanese;
    hintText = blind ? "" : word.chinese_meaning;
    audioText = word.japanese;
  } else if (isKanaPrompt) {
    label = "平假名读音";
    mainText = blind ? "🔇 听读音选择" : word.reading;
    hintText = blind ? "" : "";
    audioText = word.reading;
  } else if (isJpPrompt) {
    label = "日语单词";
    mainText = blind ? "🔇 听读音选择" : word.japanese;
    hintText = blind ? "" : word.reading;
    audioText = word.japanese;
  } else {
    label = "中文释义";
    mainText = word.chinese_meaning;
    hintText = "";
    audioText = "";
  }

  return (
    <View style={styles.card}>
      {/* Badges */}
      <View style={styles.topRow}>
        {word.jlpt_level ? (
          <View style={styles.jlptBadge}>
            <Text style={styles.jlptText}>N{word.jlpt_level}</Text>
          </View>
        ) : <View />}
        <Pressable onPress={() => fav ? removeFavorite(word.id) : addFavorite(word)}
          style={[styles.favBtn, fav && styles.favActive]}>
          <Text style={styles.favText}>{fav ? "⭐" : "☆"}</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>{label}</Text>
      <View style={styles.wordRow}>
        <Text style={[styles.mainText, isKanaPrompt && { fontSize: 26 }, blind && !showMeaning && styles.blindText]}>
          {mainText}
        </Text>
        {audioText && <AudioButton text={audioText} />}
      </View>
      {hintText ? <Text style={styles.reading}>{hintText}</Text> : null}
      {showMeaning && (
        <View style={styles.meaningSection}>
          <Text style={styles.meaningText}>
            {isKanaMode
              ? `${word.japanese}（${word.reading}）= ${word.chinese_meaning}`
              : isJpPrompt
                ? word.chinese_meaning
                : `${word.japanese}（${word.reading}）`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff", borderRadius: 16, padding: 24,
    marginHorizontal: 16, marginTop: 16, alignItems: "center",
    borderWidth: 1, borderColor: "#f1f5f9",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  topRow: { position: "absolute", top: 10, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 12, fontWeight: "500", color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  wordRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  mainText: { fontSize: 30, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  blindText: { color: "#cbd5e1", fontStyle: "italic" },
  reading: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
  meaningSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9", width: "100%" },
  meaningText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  jlptBadge: { backgroundColor: "#f1f5f9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  jlptText: { fontSize: 12, fontWeight: "500", color: "#64748b" },
  favBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  favActive: { backgroundColor: "#fef9c3" },
  favText: { fontSize: 18 },
});
