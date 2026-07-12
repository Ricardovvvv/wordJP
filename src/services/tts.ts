/**
 * TTS — Youdao dictvoice primary, SpeechSynthesis fallback.
 */
import { Platform } from "react-native";

function playViaAudioElement(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(false); return; }
    const a = new Audio(url);
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    const p = a.play();
    if (p) p.catch(() => resolve(false));
  });
}

export async function speakJapanese(text: string): Promise<void> {
  if (Platform.OS !== "web" || typeof window === "undefined") return;

  // Google TTS — reliably produces Japanese voice with tl=ja parameter
  const google = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ja&client=tw-ob`;
  const result = await playViaAudioElement(google);
  if (result) return;

  // Youdao as backup
  const youdao = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=jap`;
  const r2 = await playViaAudioElement(youdao);
  if (r2) return;

  // Browser fallback
  try {
    const synth = (window as any).speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = 0.9;
    const voices = synth.getVoices();
    const ja = voices.find((v: any) => v.lang.startsWith("ja"));
    if (ja) u.voice = ja;
    await new Promise<void>((resolve) => {
      u.onend = () => resolve();
      u.onerror = () => resolve();
      synth.speak(u);
    });
  } catch {}
}

export function preloadVoices() {}
