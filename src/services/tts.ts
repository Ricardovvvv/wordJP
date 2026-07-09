import { Platform } from "react-native";

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function getJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();

  // Prefer native Japanese voices
  const jaVoices = voices.filter(
    (v) => v.lang.startsWith("ja") || v.lang === "ja-JP"
  );

  if (jaVoices.length > 0) {
    // Try to find the best quality voice
    const preferred = jaVoices.find(
      (v) =>
        v.name.includes("Kyoko") ||
        v.name.includes("Otoya") ||
        v.name.includes("Google") ||
        v.name.includes("Microsoft")
    );
    return preferred || jaVoices[0];
  }

  return null;
}

export async function speakJapanese(text: string): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.speechSynthesis) {
    return speakWeb(text);
  }

  // Native: will implement with expo-speech later
  console.log("TTS not available on this platform yet");
}

function speakWeb(text: string): Promise<void> {
  return new Promise((resolve) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;

    // Try to get a cached Japanese voice
    if (cachedVoices) {
      const voice = getJapaneseVoice();
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve(); // Don't block on error

    // Load voices if not cached
    if (!cachedVoices) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        cachedVoices = voices;
        const voice = getJapaneseVoice();
        if (voice) utterance.voice = voice;
      }
    }

    window.speechSynthesis.speak(utterance);
  });
}

// Preload voices on user interaction
export function preloadVoices() {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.speechSynthesis) {
    const loadVoices = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}
