import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { initializeDatabase } from "../src/db/client";
import { seedDatabase } from "../src/db/seed";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function setup() {
      try { await initializeDatabase(); await seedDatabase(); } catch (e) { console.error("DB init failed:", e); }
      setReady(true);
    }
    setup();
  }, []);

  if (!ready) {
    return (
      <View style={s.splash}>
        <Text style={s.title}>wordJP</Text>
        <Text style={s.subtitle}>日语单词学习</Text>
        <ActivityIndicator color="#2563eb" style={{ marginTop: 16 }} />
      </View>
    );
  }

  const hOpts = {
    headerBackTitle: "返回",
    headerTintColor: "#2563eb",
    headerStyle: { backgroundColor: "#f8fafc" },
  };

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="quiz/[mode]" options={{ headerShown: true, headerTitle: "答题中", ...hOpts }} />
        <Stack.Screen name="flashcard" options={{ headerShown: true, headerTitle: "刷词模式", ...hOpts }} />
        <Stack.Screen name="collection" options={{ headerShown: true, headerTitle: "收藏 · 错题", ...hOpts }} />
        <Stack.Screen name="progress" options={{ headerShown: true, headerTitle: "学习进度", ...hOpts }} />
        <Stack.Screen name="settings" options={{ headerShown: true, headerTitle: "设置", ...hOpts }} />
      </Stack>
    </>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#94a3b8" },
});
