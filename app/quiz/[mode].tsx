import { useState } from "react";
import { View, Text, Pressable, ScrollView, SafeAreaView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { WordCard } from "../../src/components/WordCard";
import { OptionButton } from "../../src/components/OptionButton";
import { ProgressBar } from "../../src/components/ProgressBar";
import { QuizSummary } from "../../src/components/QuizSummary";
import { useQuizStore } from "../../src/stores/quizStore";
import { useSettingsStore } from "../../src/stores/settingsStore";
import { recordAnswer } from "../../src/services/spaced-repetition";
import { generateQuestions } from "../../src/services/quiz";
import type { QuizMode } from "../../src/types";

type QuizPhase = "answering" | "feedback" | "finished";

export default function QuizScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode: string }>();
  const mode = Number(modeParam) as QuizMode;

  const { questions, currentIndex, results, submitAnswer, nextQuestion, endQuiz } = useQuizStore();
  const [phase, setPhase] = useState<QuizPhase>("answering");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const question = questions[currentIndex];
  const currentResult = results[currentIndex];

  const handleSelect = (index: number) => {
    if (phase !== "answering") return;
    setSelectedIdx(index);
    submitAnswer(index);
    setPhase("feedback");
    const option = question.options[index];
    try { recordAnswer(question.promptWord.id, mode, option.isCorrect); } catch {}
  };

  const handleNext = () => {
    if (phase === "feedback") {
      nextQuestion();
      const state = useQuizStore.getState();
      if (state.isFinished) {
        setPhase("finished");
      } else {
        setPhase("answering");
        setSelectedIdx(null);
      }
    }
  };

  const handleRestart = () => {
    endQuiz();
    const s = useSettingsStore.getState().settings;
    const newQuestions = generateQuestions(mode, s.dailyGoal, {
      jlptLevels: s.jlptLevels, sources: s.sources,
    });
    if (newQuestions.length > 0) {
      useQuizStore.getState().startQuiz(mode, newQuestions);
      setPhase("answering");
      setSelectedIdx(null);
    } else {
      router.back();
    }
  };

  const handleGoHome = () => { endQuiz(); router.back(); };

  const getOptionState = (optIdx: number): "normal" | "selected-correct" | "selected-wrong" | "revealed-correct" | "dimmed" => {
    if (phase !== "feedback" || !currentResult) return "normal";
    const opt = question.options[optIdx];
    const selected = optIdx === currentResult.selectedIndex;
    if (selected && currentResult.isCorrect) return "selected-correct";
    if (selected && !currentResult.isCorrect) return "selected-wrong";
    if (!selected && opt.isCorrect) return "revealed-correct";
    return "dimmed";
  };

  if (phase === "finished") {
    return (
      <SafeAreaView style={styles.safe}>
        <QuizSummary results={results} onRestart={handleRestart} onGoHome={handleGoHome} />
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无题目，请检查词库设置</Text>
        <Pressable onPress={handleGoHome} style={styles.backBtn}>
          <Text style={styles.backBtnText}>返回</Text>
        </Pressable>
      </View>
    );
  }

  const isJpPrompt = mode === 1 || mode === 3;
  const isSentenceMode = mode === 3 || mode === 4;
  const isKanaMode = mode === 5 || mode === 6;
  // Show audio on options that are Japanese text
  const showOptionAudio = mode === 2 || mode === 4 || mode === 5 || mode === 6;

  // Option label text
  let optionLabel: string;
  if (mode === 5) optionLabel = "选择对应的平假名读音";
  else if (mode === 6) optionLabel = "选择对应的汉字";
  else if (isSentenceMode)
    optionLabel = isJpPrompt ? "选择可能使用该单词的中文句子" : "选择可能使用该单词的日语句子";
  else
    optionLabel = isJpPrompt ? "选择对应的中文释义" : "选择对应的日语单词";

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar current={currentIndex + (phase === "feedback" ? 1 : 0)} total={questions.length} />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        <WordCard word={question.promptWord} mode={mode} showMeaning={phase === "feedback"} />

        <Text style={styles.optionLabel}>
          {optionLabel}
        </Text>

        <View style={styles.optionsWrap}>
          {question.options.map((option, idx) => (
            <OptionButton
              key={idx}
              option={option}
              index={idx}
              state={getOptionState(idx)}
              onPress={handleSelect}
              disabled={phase === "feedback"}
              showAudio={showOptionAudio}
            />
          ))}
        </View>

        {phase === "feedback" && (
          <View style={styles.feedbackDetail}>
            <Text style={styles.feedbackTitle}>详细对照</Text>
            {currentResult?.allOptionsDetail.map((detail, i) => (
              <View key={i} style={[styles.feedbackRow, i < 3 && styles.feedbackBorder]}>
                <Text style={[styles.feedbackText, question.options[i].isCorrect && styles.feedbackCorrect]}>
                  {detail.text}
                </Text>
                <Text style={styles.feedbackSecondary}>{detail.secondary}</Text>
              </View>
            ))}
          </View>
        )}

        {phase === "feedback" && (
          <View style={styles.feedbackArea}>
            <View style={[styles.resultBanner, currentResult?.isCorrect ? styles.resultCorrect : styles.resultWrong]}>
              <Text style={[styles.resultBannerText, currentResult?.isCorrect ? styles.resultCorrectText : styles.resultWrongText]}>
                {currentResult?.isCorrect ? "✓ 正确！" : "✗ 错误"}
              </Text>
            </View>
            <Pressable onPress={handleNext} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>
                {currentIndex + 1 >= questions.length ? "查看结果" : "下一题"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { flex: 1 },
  empty: { flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#94a3b8", fontSize: 16 },
  backBtn: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 24, backgroundColor: "#3b82f6", borderRadius: 8 },
  backBtnText: { color: "#ffffff", fontWeight: "500" },
  optionLabel: { fontSize: 14, fontWeight: "500", color: "#94a3b8", paddingHorizontal: 16, marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  optionsWrap: { paddingHorizontal: 16 },
  feedbackDetail: { marginHorizontal: 16, marginTop: 8, padding: 16, backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#f1f5f9" },
  feedbackTitle: { fontSize: 12, fontWeight: "500", color: "#94a3b8", marginBottom: 8 },
  feedbackRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  feedbackBorder: { borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  feedbackText: { fontSize: 14, flex: 1, color: "#475569" },
  feedbackCorrect: { color: "#15803d", fontWeight: "600" },
  feedbackSecondary: { fontSize: 12, color: "#94a3b8", marginLeft: 8 },
  feedbackArea: { paddingHorizontal: 16, marginTop: 16 },
  resultBanner: { borderRadius: 12, padding: 16, marginBottom: 12 },
  resultCorrect: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" },
  resultWrong: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  resultBannerText: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  resultCorrectText: { color: "#15803d" },
  resultWrongText: { color: "#991b1b" },
  nextBtn: { backgroundColor: "#3b82f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  nextBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
});
