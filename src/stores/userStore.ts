import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  createdAt: string;
}

interface UserState {
  users: User[];
  currentUser: User;
  load: () => void;
  switchTo: (id: string) => void;
  addUser: (name: string) => void;
  renameUser: (id: string, newName: string) => void;
  deleteUser: (id: string) => void;
}

function saveUsers(users: User[]) {
  try { localStorage.setItem("wordjp_users", JSON.stringify(users)); } catch {}
}
function saveCurrent(id: string) {
  try { localStorage.setItem("wordjp_current_user", id); } catch {}
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: { id: "default", name: "Momo", createdAt: new Date().toISOString() },

  load: () => {
    try {
      const raw = localStorage.getItem("wordjp_users");
      let users: User[] = raw ? JSON.parse(raw) : [];
      if (users.length === 0) {
        users = [{ id: "default", name: "Momo", createdAt: new Date().toISOString() }];
        saveUsers(users);
      }
      const currentId = localStorage.getItem("wordjp_current_user") || "default";
      const currentUser = users.find((u) => u.id === currentId) || users[0];
      set({ users, currentUser });
    } catch {}
  },

  switchTo: (id: string) => {
    const user = get().users.find((u) => u.id === id);
    if (user) {
      set({ currentUser: user });
      saveCurrent(id);
    }
  },

  addUser: (name: string) => {
    const users = [...get().users, { id: Date.now().toString(), name, createdAt: new Date().toISOString() }];
    set({ users });
    saveUsers(users);
  },

  renameUser: (id: string, newName: string) => {
    const users = get().users.map((u) => (u.id === id ? { ...u, name: newName } : u));
    const currentUser = get().currentUser.id === id ? { ...get().currentUser, name: newName } : get().currentUser;
    set({ users, currentUser });
    saveUsers(users);
  },

  deleteUser: (id: string) => {
    const users = get().users.filter((u) => u.id !== id);
    if (get().currentUser.id === id) {
      const newCurrent = users[0] || { id: "default", name: "Momo", createdAt: new Date().toISOString() };
      set({ users, currentUser: newCurrent });
      saveCurrent(newCurrent.id);
    } else {
      set({ users });
    }
    saveUsers(users);
  },
}));
