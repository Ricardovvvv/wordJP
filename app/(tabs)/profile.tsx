import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useUserStore } from "../../src/stores/userStore";
import { useCollectionStore } from "../../src/stores/collectionStore";

const ITEMS = [
  { label: "⭐ 收藏夹", description: "查看收藏单词和错题本", icon: "⭐", route: "/collection" },
  { label: "📊 学习进度", description: "累计答题统计与正确率", icon: "📊", route: "/progress" },
  { label: "⚙️ 设置", description: "教材选择、词库管理、每日目标", icon: "⚙️", route: "/settings" },
];

export default function ProfileScreen() {
  const { users, currentUser, switchTo, addUser, renameUser, deleteUser, load } = useUserStore();
  const loadCollections = useCollectionStore((s) => s.loadFromStorage);
  const [newName, setNewName] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => { load(); }, []);

  const handleSwitch = (id: string) => {
    switchTo(id);
    // Force page reload to reinitialize all stores with new user's data
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleAdd = () => {
    const n = newName.trim();
    if (!n) return;
    addUser(n);
    setNewName("");
    loadCollections();
  };

  const handleRename = (id: string) => {
    const name = editName.trim();
    if (!name) return;
    renameUser(id, name);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteUser(id);
    loadCollections();
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.title}>我的</Text>
        <Text style={st.subtitle}>wordJP 日语单词学习</Text>
      </View>

      {/* Current user badge */}
      <View style={st.userCard}>
        <View style={st.avatarLarge}>
          <Text style={st.avatarLargeText}>{currentUser.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.userNameLarge}>{currentUser.name}</Text>
          <Text style={st.userHint}>当前用户</Text>
        </View>
        <Pressable onPress={() => setExpanded(!expanded)} style={st.expandBtn}>
          <Text style={st.expandText}>{expanded ? "收起 ▲" : "管理 ▼"}</Text>
        </Pressable>
      </View>

      {/* Collapsible user manager */}
      {expanded && (
        <View style={st.manager}>
          {/* Add user */}
          <View style={st.addRow}>
            <TextInput
              style={st.addInput}
              placeholder="输入新用户名..."
              placeholderTextColor="#94a3b8"
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable onPress={handleAdd} style={st.addBtn}>
              <Text style={st.addBtnText}>+ 添加</Text>
            </Pressable>
          </View>

          {/* User list */}
          {users.map((u, i) => (
            <View key={u.id} style={st.userItem}>
              {/* Avatar + name */}
              <Pressable
                onPress={() => handleSwitch(u.id)}
                style={[st.userSelect, u.id === currentUser.id && st.userSelectActive]}
              >
                <View style={[st.avatarSmall, u.id === currentUser.id && st.avatarSmallActive]}>
                  <Text style={[st.avatarSmallText, u.id === currentUser.id && st.avatarSmallTextActive]}>
                    {u.name[0]}
                  </Text>
                </View>
                {editingId === u.id ? (
                  <TextInput
                    style={st.editInput}
                    value={editName}
                    onChangeText={setEditName}
                    onSubmitEditing={() => handleRename(u.id)}
                    autoFocus
                    onBlur={() => setEditingId(null)}
                  />
                ) : (
                  <Text style={[st.userItemName, u.id === currentUser.id && st.userItemNameActive]}>
                    {u.name}
                    {u.id === currentUser.id ? " ✓" : ""}
                  </Text>
                )}
              </Pressable>
              {/* Actions */}
              <Pressable onPress={() => { setEditingId(u.id); setEditName(u.name); }} style={st.iconBtn}>
                <Text>✏️</Text>
              </Pressable>
              {users.length > 1 && (
                <Pressable onPress={() => handleDelete(u.id)} style={st.iconBtn}>
                  <Text>🗑️</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Navigation */}
      <Text style={st.sectionLabel}>功能</Text>
      {ITEMS.map((item) => (
        <Pressable key={item.route} onPress={() => router.push(item.route)} style={st.card}>
          <Text style={st.cardIcon}>{item.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.cardLabel}>{item.label}</Text>
            <Text style={st.cardDesc}>{item.description}</Text>
          </View>
          <Text style={st.chevron}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: "700", color: "#1e293b" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginTop: 4 },

  // Current user
  userCard: {
    backgroundColor: "#ffffff", marginHorizontal: 16, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0",
  },
  avatarLarge: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#dbeafe",
    alignItems: "center", justifyContent: "center", marginRight: 14,
  },
  avatarLargeText: { fontSize: 24, fontWeight: "700", color: "#2563eb" },
  userNameLarge: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  userHint: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  expandBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  expandText: { fontSize: 13, fontWeight: "600", color: "#64748b" },

  // Collapsible manager
  manager: {
    marginHorizontal: 16, backgroundColor: "#ffffff", borderRadius: 14, marginTop: 10,
    padding: 14, borderWidth: 1, borderColor: "#f1f5f9",
  },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  addInput: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  addBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  userItem: {
    flexDirection: "row", alignItems: "center", paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: "#f8fafc",
  },
  userSelect: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingVertical: 6, paddingHorizontal: 6, borderRadius: 10,
  },
  userSelectActive: { backgroundColor: "#eff6ff" },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  avatarSmallActive: { backgroundColor: "#dbeafe" },
  avatarSmallText: { fontSize: 16, fontWeight: "700", color: "#94a3b8" },
  avatarSmallTextActive: { color: "#2563eb" },
  userItemName: { fontSize: 15, fontWeight: "600", color: "#475569" },
  userItemNameActive: { color: "#2563eb" },
  editInput: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  iconBtn: { padding: 8 },

  // Chips
  sectionLabel: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  chipScroll: { marginBottom: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  chipActive: { backgroundColor: "#dbeafe", borderColor: "#93c5fd" },
  chipText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  chipTextActive: { color: "#2563eb" },

  // Feature cards
  card: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 8, borderRadius: 14,
    padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0",
  },
  cardIcon: { fontSize: 26, marginRight: 16 },
  cardLabel: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  cardDesc: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  chevron: { fontSize: 24, color: "#cbd5e1" },
});
