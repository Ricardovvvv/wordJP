/**
 * TTS service — uses browser SpeechSynthesis (always works, no CORS).
 */
import { Platform } from "react-native";
import type { SpeechSynthesisVoice } from "../types";

let cachedVoices: typeof SpeechSynthesisVoice[] = [];

function getJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices: SpeechSynthesisVoice[] = (window as any).speechSynthesis?.getVoices?.() || [];
  const ja = voices.filter((v) => v.lang.startsWith("ja"));
  if (ja.length === 0) return null;
  const best = ja.find((v) => v.name.includes("Kyoko") || v.name.includes("Otoya") || v.name.includes("Google")) || ja[0];
  return best;
}

export async function speakJapanese(text: string): Promise<void> {
  if (Platform.OS !== "web" || typeof window === "undefined") return;

  return new Promise((resolve) => {
    const synth = (window as any).speechSynthesis;
    if (!synth) { resolve(); return; }

    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = 0.9;

    if (cachedVoices.length === 0) {
      const v = (window as any).speechSynthesis.getVoices();
      if (v.length > 0) cachedVoices = v;
    }
    const voice = getJapaneseVoice();
    if (voice) u.voice = voice;

    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}

export function preloadVoices() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  const s = (window as any).speechSynthesis;
  if (!s) return;
  cachedVoices = s.getVoices();
  s.onvoiceschanged = () => { cachedVoices = s.getVoices(); };
}
