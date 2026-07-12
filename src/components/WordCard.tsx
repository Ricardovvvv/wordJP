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
  stats?: { correct: number; wrong: number };
}

export function WordCard({ word, mode, showMeaning = false, blind = false, stats }: WordCardProps) {
  const { isFavorite, addFavorite, removeFavorite } = useCollectionStore();
  const fav = isFavorite(word.id);
  const st = stats || { correct: 0, wrong: 0 };

  const isJpPrompt = mode === 1 || mode === 3;
  const isKanjiPrompt = mode === 5;
  const isKanaPrompt = mode === 6;
  const isKanaMode = isKanjiPrompt || isKanaPrompt;

  let label: string;
  let mainText: string;
  let hintText: string;
  let audioText: string;

  if (mode === 1) {
    label = "日语单词";
    mainText = blind ? "🔇 听读音选择" : word.reading;
    hintText = word.japanese;
    audioText = word.reading;
  } else if (isKanjiPrompt) {
    label = "汉字 → 选假名读音";
    mainText = blind ? "🔇 听读音选择" : word.japanese;
    hintText = word.chinese_meaning;
    audioText = word.japanese;
  } else if (isKanaPrompt) {
    label = "假名读音 → 选汉字";
    mainText = blind ? "🔇 听读音选择" : word.reading;
    hintText = "";
    audioText = word.reading;
  } else if (isJpPrompt) {
    label = "日语单词";
    mainText = blind ? "🔇 听读音选择" : word.japanese;
    hintText = word.reading;
    audioText = word.japanese;
  } else {
    label = "中文释义";
    mainText = word.chinese_meaning;
    hintText = "";
    audioText = "";
  }

  return (
    <View style={styles.card}>
      {/* Badges row */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          {word.jlpt_level ? (
            <View style={styles.jlptBadge}>
              <Text style={styles.jlptText}>N{word.jlpt_level}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.rightBadgeGroup}>
          {(st.correct > 0 || st.wrong > 0) ? (
            <View style={styles.statBadges}>
              <Text style={styles.statBadgeCorrect}>✅{st.correct}</Text>
              <Text style={styles.statBadgeWrong}>❌{st.wrong}</Text>
            </View>
          ) : null}
          <Pressable onPress={() => fav ? removeFavorite(word.id) : addFavorite(word)}
            style={[styles.favBtn, fav && styles.favActive]}>
            <Text style={styles.favText}>{fav ? "⭐" : "☆"}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.label}>{label}</Text>
      <View style={styles.wordRow}>
        <Text style={[styles.mainText, isKanaPrompt && { fontSize: 26 }, blind && !showMeaning && styles.blindText]}>
          {mainText}
        </Text>
        {audioText && <AudioButton text={audioText} />}
      </View>
      {/* Hint: show during answering if it's safe context (kanji/kana, not meaning) */}
      {hintText && showMeaning ? (
        <Text style={styles.reading}>{hintText}</Text>
      ) : hintText && (mode === 1 || mode === 3) && !showMeaning ? (
        <Text style={styles.reading}>{hintText}</Text>
      ) : null}
      {/* Answer reveal */}
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
  topRow: { position: "absolute", top: 10, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badgeGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  rightBadgeGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  statBadges: { flexDirection: "row", gap: 4 },
  statBadgeCorrect: { fontSize: 11, fontWeight: "700", color: "#16a34a" },
  statBadgeWrong: { fontSize: 11, fontWeight: "700", color: "#ef4444" },
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
