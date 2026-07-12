import { create } from "zustand";
import type { Word, FavoriteWord, WrongWord } from "../types";

function userKey(base: string): string {
  try {
    const uid = localStorage.getItem("wordjp_current_user") || "default";
    return `wordjp_${uid}_${base}`;
  } catch { return `wordjp_default_${base}`; }
}

interface CollectionState {
  favorites: FavoriteWord[];
  wrongAnswers: WrongWord[];

  addFavorite: (word: Word) => void;
  removeFavorite: (wordId: number) => void;
  isFavorite: (wordId: number) => boolean;

  addWrong: (word: Word) => void;
  removeWrong: (wordId: number) => void;
  isWrong: (wordId: number) => boolean;

  loadFromStorage: () => void;
}

function saveToStorage(favs: FavoriteWord[], wrongs: WrongWord[]) {
  try {
    localStorage.setItem(userKey("favorites"), JSON.stringify(favs));
    localStorage.setItem(userKey("wrong"), JSON.stringify(wrongs));
  } catch {}
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  favorites: [],
  wrongAnswers: [],

  addFavorite: (word: Word) => {
    const { favorites } = get();
    if (favorites.some((f) => f.word.id === word.id)) return;
    const updated = [...favorites, { addedAt: new Date().toISOString(), word }];
    set({ favorites: updated });
    saveToStorage(updated, get().wrongAnswers);
  },

  removeFavorite: (wordId: number) => {
    const updated = get().favorites.filter((f) => f.word.id !== wordId);
    set({ favorites: updated });
    saveToStorage(updated, get().wrongAnswers);
  },

  isFavorite: (wordId: number) => get().favorites.some((f) => f.word.id === wordId),

  addWrong: (word: Word) => {
    const { wrongAnswers } = get();
    const existing = wrongAnswers.find((w) => w.word.id === word.id);
    let updated: WrongWord[];
    if (existing) {
      updated = wrongAnswers.map((w) =>
        w.word.id === word.id ? { ...w, wrongCount: w.wrongCount + 1 } : w
      );
    } else {
      updated = [...wrongAnswers, { wrongCount: 1, addedAt: new Date().toISOString(), word }];
    }
    set({ wrongAnswers: updated });
    saveToStorage(get().favorites, updated);
  },

  removeWrong: (wordId: number) => {
    const updated = get().wrongAnswers.filter((w) => w.word.id !== wordId);
    set({ wrongAnswers: updated });
    saveToStorage(get().favorites, updated);
  },

  isWrong: (wordId: number) => get().wrongAnswers.some((w) => w.word.id === wordId),

  loadFromStorage: () => {
    try {
      const favs = localStorage.getItem(userKey("favorites"));
      const wrongs = localStorage.getItem(userKey("wrong"));
      if (favs) set({ favorites: JSON.parse(favs) });
      if (wrongs) set({ wrongAnswers: JSON.parse(wrongs) });
    } catch {}
  },
}));
