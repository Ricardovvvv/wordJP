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
      try {
        await initializeDatabase();
        await seedDatabase();
      } catch (e) {
        console.error("DB init failed:", e);
      }
      setReady(true);
    }
    setup();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.title}>wordJP</Text>
        <Text style={styles.subtitle}>日语单词学习</Text>
        <ActivityIndicator color="#2563eb" style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="quiz/[mode]"
          options={{
            headerShown: true,
            headerTitle: "答题中",
            headerBackTitle: "返回",
            headerTintColor: "#2563eb",
            headerStyle: { backgroundColor: "#f8fafc" },
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
});
