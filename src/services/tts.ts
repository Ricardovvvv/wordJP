/**
 * TTS service — uses Youdao dictvoice API (same as PWA 日语闪卡 project).
 * Much clearer and louder than browser SpeechSynthesis.
 */
import { Platform } from "react-native";

// Primary: Youdao — excellent JP quality, free, no key needed
// Fallback: Google TTS
function getAudioUrl(text: string): string {
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=jap`;
}

function getFallbackUrl(text: string): string {
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ja&client=tw-ob`;
}

export async function speakJapanese(text: string): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    speakViaAudio(text);
    return;
  }
  // Native: fallback
  console.log("TTS not available on native yet");
}

function speakViaAudio(text: string) {
  const audio = new window.Audio(getAudioUrl(text));
  audio.play().catch(() => {
    // Fallback to Google TTS
    const fallback = new window.Audio(getFallbackUrl(text));
    fallback.play().catch(() => {});
  });
}

export function preloadVoices() {
  // No-op with audio-based TTS
}
