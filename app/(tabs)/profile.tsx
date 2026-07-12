import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, Alert } from "react-native";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    const n = newName.trim();
    if (!n) return;
    addUser(n);
    setNewName("");
  };

  const handleSwitch = (id: string) => {
    switchTo(id);
    loadCollections();
  };

  const handleRename = (id: string) => {
    const name = editName.trim();
    if (!name) return;
    renameUser(id, name);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (users.length <= 1) {
      Alert.alert("提示", "至少保留一个用户");
      return;
    }
    deleteUser(id);
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={st.header}>
        <Text style={st.title}>我的</Text>
        <Text style={st.subtitle}>wordJP 日语单词学习</Text>
      </View>

      {/* Current user */}
      <View style={st.userCard}>
        <View style={st.avatar}>
          <Text style={st.avatarText}>{currentUser.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.userName}>{currentUser.name}</Text>
          <Text style={st.userSub}>当前用户</Text>
        </View>
      </View>

      {/* Switch user */}
      <Text style={st.sectionLabel}>切换用户</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.userList} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {users.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => handleSwitch(u.id)}
            style={[st.userChip, u.id === currentUser.id && st.userChipActive]}
          >
            <Text style={[st.userChipText, u.id === currentUser.id && st.userChipTextActive]}>
              {u.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Manage users */}
      <Text style={st.sectionLabel}>管理用户</Text>
      {users.map((u) => (
        <View key={u.id} style={st.userRow}>
          <View style={st.avatarSmall}>
            <Text style={st.avatarSmallText}>{u.name[0]}</Text>
          </View>
          {editingId === u.id ? (
            <TextInput
              style={st.editInput}
              value={editName}
              onChangeText={setEditName}
              onSubmitEditing={() => handleRename(u.id)}
              autoFocus
            />
          ) : (
            <Text style={st.userRowName}>{u.name}</Text>
          )}
          <View style={st.userActions}>
            {editingId === u.id ? (
              <Pressable onPress={() => handleRename(u.id)} style={st.actionBtn}>
                <Text style={st.actionText}>✓</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => { setEditingId(u.id); setEditName(u.name); }} style={st.actionBtn}>
                <Text style={st.actionText}>✏️</Text>
              </Pressable>
            )}
            <Pressable onPress={() => handleDelete(u.id)} style={st.actionBtn}>
              <Text style={[st.actionText, { color: "#ef4444" }]}>🗑️</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {/* Add user */}
      <View style={st.addRow}>
        <TextInput
          style={st.addInput}
          placeholder="输入新用户名..."
          placeholderTextColor="#94a3b8"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
        />
        <Pressable onPress={handleAdd} style={st.addBtn}>
          <Text style={st.addBtnText}>+ 添加</Text>
        </Pressable>
      </View>

      {/* Navigation */}
      <Text style={[st.sectionLabel, { marginTop: 20 }]}>功能</Text>
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

  // Current user card
  userCard: {
    backgroundColor: "#ffffff", marginHorizontal: 16, borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0",
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#dbeafe",
    alignItems: "center", justifyContent: "center", marginRight: 14,
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#2563eb" },
  userName: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  userSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  // User chips
  sectionLabel: { fontSize: 14, fontWeight: "500", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  userList: { marginBottom: 4 },
  userChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  userChipActive: { backgroundColor: "#dbeafe", borderColor: "#93c5fd" },
  userChipText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  userChipTextActive: { color: "#2563eb" },

  // Manage
  userRow: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 6,
    backgroundColor: "#ffffff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f1f5f9",
  },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  avatarSmallText: { fontSize: 16, fontWeight: "700", color: "#64748b" },
  userRowName: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1e293b" },
  editInput: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, borderWidth: 1, borderColor: "#e2e8f0" },
  userActions: { flexDirection: "row", gap: 4 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  actionText: { fontSize: 16 },

  addRow: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 6 },
  addInput: { flex: 1, backgroundColor: "#ffffff", borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: "#e2e8f0" },
  addBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },

  // Feature cards
  card: {
    backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 8, borderRadius: 14,
    padding: 18, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  cardIcon: { fontSize: 26, marginRight: 16 },
  cardLabel: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  cardDesc: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  chevron: { fontSize: 24, color: "#cbd5e1" },
});
