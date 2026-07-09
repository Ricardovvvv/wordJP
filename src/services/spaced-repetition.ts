import { getDatabase, eq, and } from "../db/client";
import { userProgress } from "../db/client";

// Simplified SM-2 spaced repetition algorithm
// Maps quality of response (0-5) to next review interval

const INTERVALS_MINUTES = [1, 10, 60, 1440, 4320, 10080]; // 1m, 10m, 1h, 1d, 3d, 7d

function calculateNextReview(
  quality: number, // 0 = wrong, 5 = perfect
  consecutiveCorrect: number
): string {
  const intervalMinutes =
    INTERVALS_MINUTES[Math.min(consecutiveCorrect, INTERVALS_MINUTES.length - 1)];
  const nextDate = new Date(Date.now() + intervalMinutes * 60 * 1000);
  return nextDate.toISOString();
}

export function recordAnswer(
  wordId: number,
  quizMode: number,
  isCorrect: boolean
) {
  const { db } = getDatabase();

  const existing = db
    .select()
    .from(userProgress)
    .where(
      and(eq(userProgress.word_id, wordId), eq(userProgress.quiz_mode, quizMode))
    )
    .all();

  const now = new Date().toISOString();

  if (existing.length > 0) {
    const record = existing[0];
    const correctCount = record.correct_count + (isCorrect ? 1 : 0);
    const wrongCount = record.wrong_count + (isCorrect ? 0 : 1);
    const nextReview = calculateNextReview(
      isCorrect ? 4 : 1,
      correctCount
    );

    db.update(userProgress)
      .set({
        correct_count: correctCount,
        wrong_count: wrongCount,
        last_reviewed_at: now,
        next_review_at: nextReview,
      })
      .where(eq(userProgress.id, record.id))
      .run();
  } else {
    db.insert(userProgress)
      .values({
        word_id: wordId,
        quiz_mode: quizMode,
        correct_count: isCorrect ? 1 : 0,
        wrong_count: isCorrect ? 0 : 1,
        last_reviewed_at: now,
        next_review_at: calculateNextReview(isCorrect ? 3 : 1, isCorrect ? 1 : 0),
      })
      .run();
  }
}

export function getWordsDueForReview(quizMode?: number): number[] {
  const { db } = getDatabase();

  const now = new Date().toISOString();
  const conditions = quizMode
    ? [eq(userProgress.quiz_mode, quizMode)]
    : [];

  const due = db
    .select({ word_id: userProgress.word_id })
    .from(userProgress)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .all();

  // Filter words where next_review_at <= now
  return due
    .filter((r) => {
      const progress = db
        .select()
        .from(userProgress)
        .where(eq(userProgress.word_id, r.word_id))
        .all()[0];
      return progress && progress.next_review_at && progress.next_review_at <= now;
    })
    .map((r) => r.word_id);
}

export function getProgressStats() {
  const { db } = getDatabase();

  const all = db.select().from(userProgress).all();

  const totalReviewed = all.length;
  const totalCorrect = all.reduce((sum, r) => sum + r.correct_count, 0);
  const totalWrong = all.reduce((sum, r) => sum + r.wrong_count, 0);
  const total = totalCorrect + totalWrong;
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  // Words learned (correct at least once)
  const wordsLearned = all.filter((r) => r.correct_count > 0).length;

  // Today's stats
  const today = new Date().toISOString().split("T")[0];
  const todayReviewed = all.filter(
    (r) => r.last_reviewed_at && r.last_reviewed_at.startsWith(today)
  ).length;

  return {
    totalReviewed,
    totalCorrect,
    totalWrong,
    accuracy,
    wordsLearned,
    todayReviewed,
  };
}
