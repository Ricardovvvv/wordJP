import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";

const ITEMS = [
  { label: "⭐ 收藏夹", description: "查看收藏单词和错题本", icon: "⭐", route: "/(tabs)/collection" },
  { label: "📊 学习进度", description: "累计答题统计与正确率", icon: "📊", route: "/(tabs)/progress" },
  { label: "⚙️ 设置", description: "教材选择、词库管理、每日目标", icon: "⚙️", route: "/(tabs)/settings" },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={s.header}>
        <Text style={s.title}>我的</Text>
        <Text style={s.subtitle}>wordJP 日语单词学习</Text>
      </View>

      {ITEMS.map((item) => (
        <Pressable key={item.route} onPress={() => router.push(item.route)} style={s.card}>
          <Text style={s.icon}>{item.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>{item.label}</Text>
            <Text style={s.desc}>{item.description}</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#1e293b" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  card: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 10, borderRadius: 14,
    padding: 18, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  icon: { fontSize: 28, marginRight: 16 },
  label: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  desc: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  chevron: { fontSize: 24, color: "#cbd5e1" },
});
