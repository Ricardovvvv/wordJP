import { Pressable, Text, View, StyleSheet } from "react-native";
import type { QuizOption } from "../types";
import { speakJapanese } from "../services/tts";
import { useState } from "react";

interface OptionButtonProps {
  option: QuizOption;
  index: number;
  state: "normal" | "selected-correct" | "selected-wrong" | "revealed-correct" | "dimmed";
  onPress: (index: number) => void;
  disabled: boolean;
  showAudio?: boolean;
}

const LABELS = ["A", "B", "C", "D"];

const STATE_COLORS = {
  normal: { bg: "#ffffff", border: "#e2e8f0", text: "#1e293b", labelBg: "#f1f5f9", labelText: "#64748b" },
  "selected-correct": { bg: "#f0fdf4", border: "#4ade80", text: "#166534", labelBg: "#dcfce7", labelText: "#166534" },
  "selected-wrong": { bg: "#fef2f2", border: "#f87171", text: "#991b1b", labelBg: "#fee2e2", labelText: "#991b1b" },
  "revealed-correct": { bg: "#f0fdf4", border: "#86efac", text: "#15803d", labelBg: "#dcfce7", labelText: "#166534" },
  dimmed: { bg: "#ffffff", border: "#f1f5f9", text: "#cbd5e1", labelBg: "#f8fafc", labelText: "#cbd5e1" },
};

function SmallAudioBtn({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const handlePress = async () => {
    if (playing) return;
    setPlaying(true);
    try { await speakJapanese(text); } catch {}
    setTimeout(() => setPlaying(false), 400);
  };
  return (
    <Pressable
      onPress={handlePress}
      style={[audioStyles.btn, playing && audioStyles.playing]}
      hitSlop={4}
    >
      <Text style={audioStyles.icon}>{playing ? "🔊" : "🔈"}</Text>
    </Pressable>
  );
}

const audioStyles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  playing: { backgroundColor: "#dbeafe" },
  icon: { fontSize: 14 },
});

export function OptionButton({ option, index, state, onPress, disabled, showAudio }: OptionButtonProps) {
  const colors = STATE_COLORS[state];

  return (
    <Pressable
      onPress={() => onPress(index)}
      disabled={disabled}
      style={[styles.button, { backgroundColor: colors.bg, borderColor: colors.border }]}
    >
      <View style={[styles.labelCircle, { backgroundColor: colors.labelBg }]}>
        <Text style={[styles.labelText, { color: colors.labelText }]}>{LABELS[index]}</Text>
      </View>
      <Text style={[styles.optionText, { color: colors.text }]} numberOfLines={3}>
        {option.text}
      </Text>
      {showAudio && <SmallAudioBtn text={option.text} />}
      {state === "selected-correct" && <Text style={styles.resultIcon}>✓</Text>}
      {state === "selected-wrong" && <Text style={styles.resultIcon}>✗</Text>}
      {state === "revealed-correct" && <Text style={styles.dimmedCorrect}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  labelCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  resultIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  dimmedCorrect: {
    fontSize: 20,
    marginLeft: 8,
    color: "#4ade80",
  },
});
