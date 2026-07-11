import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";

function TabIcon({ label }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    "学习": "📚", "进度": "📊", "搜索": "🔍", "五十音": "🔤", "收藏": "⭐",
  };
  return (
    <View style={styles.iconWrap}>
      <Text style={styles.icon}>{icons[label] ?? "📖"}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#f8fafc" },
        headerTitleStyle: { color: "#0f172a", fontWeight: "600" },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#e2e8f0" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "学习", headerTitle: "wordJP", tabBarIcon: ({ focused }) => <TabIcon label="学习" focused={focused} /> }} />
      <Tabs.Screen name="search" options={{ title: "搜索", headerTitle: "单词搜索", tabBarIcon: ({ focused }) => <TabIcon label="搜索" focused={focused} /> }} />
      <Tabs.Screen name="gojuon" options={{ title: "五十音", headerTitle: "五十音图", tabBarIcon: ({ focused }) => <TabIcon label="五十音" focused={focused} /> }} />
      <Tabs.Screen name="collection" options={{ title: "收藏", headerTitle: "收藏 · 错题", tabBarIcon: ({ focused }) => <TabIcon label="收藏" focused={focused} /> }} />
      <Tabs.Screen name="progress" options={{ title: "进度", headerTitle: "学习进度", tabBarIcon: ({ focused }) => <TabIcon label="进度" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: "设置", headerTitle: "设置", tabBarIcon: () => <Text style={styles.icon}>⚙️</Text> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center" },
  icon: { fontSize: 18 },
});
