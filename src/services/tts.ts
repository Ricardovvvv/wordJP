/**
 * TTS — uses browser SpeechSynthesis with ja-JP lang.
 * This forces the browser to use Japanese phonetics regardless of system voices.
 */
import { Platform } from "react-native";

export async function speakJapanese(text: string): Promise<void> {
  if (Platform.OS !== "web" || typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "ja-JP";
  utt.rate = 0.9;

  // Try to find a native Japanese voice for best quality
  let voices: SpeechSynthesisVoice[] = synth.getVoices();
  if (voices.length === 0) {
    await new Promise<void>((resolve) => {
      synth.onvoiceschanged = () => { voices = synth.getVoices(); resolve(); };
    });
  }

  const jaVoice = voices.find((v) => v.lang.startsWith("ja") || v.lang === "ja-JP");
  if (jaVoice) utt.voice = jaVoice;

  return new Promise((resolve) => {
    utt.onend = () => resolve();
    utt.onerror = () => resolve();
    // Chrome needs a user interaction context — fire a fallback if blocked
    try {
      synth.speak(utt);
    } catch {
      resolve();
    }
  });
}

export function preloadVoices() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  const s = window.speechSynthesis;
  if (!s) return;
  s.getVoices();
  s.onvoiceschanged = () => s.getVoices();
}
