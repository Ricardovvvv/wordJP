import { create } from "zustand";
import type { QuizMode, QuizQuestion, QuizResult } from "../types";

interface QuizStoreState {
  mode: QuizMode;
  questions: QuizQuestion[];
  currentIndex: number;
  results: QuizResult[];
  isActive: boolean;
  isFinished: boolean;

  startQuiz: (mode: QuizMode, questions: QuizQuestion[]) => void;
  submitAnswer: (selectedIndex: number) => void;
  nextQuestion: () => void;
  endQuiz: () => void;
}

export const useQuizStore = create<QuizStoreState>((set, get) => ({
  mode: 1,
  questions: [],
  currentIndex: 0,
  results: [],
  isActive: false,
  isFinished: false,

  startQuiz: (mode, questions) =>
    set({
      mode,
      questions,
      currentIndex: 0,
      results: [],
      isActive: true,
      isFinished: false,
    }),

  submitAnswer: (selectedIndex: number) => {
    const { questions, currentIndex } = get();
    const question = questions[currentIndex];
    const selectedOption = question.options[selectedIndex];
    const isCorrect = selectedOption.isCorrect;

    const allOptionsDetail = question.options.map((opt) => {
      const word = opt.isCorrect ? question.promptWord : null;
      return {
        text: opt.text,
        secondary: opt.secondaryText ?? "",
      };
    });

    const result: QuizResult = {
      question,
      selectedIndex,
      isCorrect,
      allOptionsDetail,
    };

    set({ results: [...get().results, result] });
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex + 1 >= questions.length) {
      set({ isFinished: true });
    } else {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  endQuiz: () =>
    set({
      isActive: false,
      isFinished: false,
      questions: [],
      results: [],
      currentIndex: 0,
    }),
}));
