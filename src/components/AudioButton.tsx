import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { speakJapanese } from "../services/tts";

interface AudioButtonProps {
  text: string;
}

export function AudioButton({ text }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);

  const handlePress = () => {
    if (playing) return;
    setPlaying(true);
    speakJapanese(text);
    setTimeout(() => setPlaying(false), 600);
  };

  return (
    <Pressable onPress={handlePress} style={[styles.button, playing && styles.playing]} hitSlop={4}>
      <AudioIcon size={18} />
    </Pressable>
  );
}

function AudioIcon({ size }: { size: number }) {
  // Simple text-based icon — works everywhere
  const { Text } = require("react-native");
  return <Text style={{ fontSize: size }}>🔊</Text>;
}

const styles = StyleSheet.create({
  button: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
  },
  playing: { backgroundColor: "#dbeafe" },
});
