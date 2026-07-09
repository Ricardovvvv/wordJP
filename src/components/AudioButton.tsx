import { useState } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { speakJapanese } from "../services/tts";

interface AudioButtonProps {
  text: string;
}

export function AudioButton({ text }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);

  const handlePress = async () => {
    if (playing) return;
    setPlaying(true);
    await speakJapanese(text);
    setTimeout(() => setPlaying(false), 500);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.button, playing && styles.playing]}
      hitSlop={4}
    >
      <Text style={styles.icon}>{playing ? "🔊" : "🔈"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  playing: {
    backgroundColor: "#dbeafe",
  },
  icon: {
    fontSize: 18,
  },
});
