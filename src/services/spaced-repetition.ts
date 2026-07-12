import { getDatabase, eq, and } from "../db/client";
import { userProgress } from "../db/client";

const INTERVALS_MINUTES = [1, 10, 60, 1440, 4320, 10080];

function calculateNextReview(consecutiveCorrect: number): string {
  const interval = INTERVALS_MINUTES[Math.min(consecutiveCorrect, INTERVALS_MINUTES.length - 1)];
  return new Date(Date.now() + interval * 60 * 1000).toISOString();
}

// LocalStorage backup for web — survives refresh
function lsKey(): string {
  try {
    const uid = localStorage.getItem("wordjp_current_user") || "default";
    return `wordjp_${uid}_progress`;
  } catch { return "wordjp_default_progress"; }
}
function saveProgressToLS(all: any[]) {
  try { localStorage.setItem(lsKey(), JSON.stringify(all)); } catch {}
}
function loadProgressFromLS(): any[] {
  try {
    const raw = localStorage.getItem(lsKey());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function recordAnswer(wordId: number, quizMode: number, isCorrect: boolean) {
  const { db } = getDatabase();

  const existing = db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.word_id, wordId), eq(userProgress.quiz_mode, quizMode)))
    .all();

  const now = new Date().toISOString();

  if (existing.length > 0) {
    const record = existing[0];
    const correctCount = record.correct_count + (isCorrect ? 1 : 0);
    const wrongCount = record.wrong_count + (isCorrect ? 0 : 1);

    db.update(userProgress)
      .set({
        correct_count: correctCount,
        wrong_count: wrongCount,
        last_reviewed_at: now,
        next_review_at: calculateNextReview(correctCount),
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
        next_review_at: calculateNextReview(isCorrect ? 1 : 0),
      })
      .run();
  }

  // Backup to localStorage for web persistence
  try {
    const all = db.select().from(userProgress).all();
    saveProgressToLS(all);
  } catch {}
}

export function getProgressStats() {
  const { db } = getDatabase();
  let all = db.select().from(userProgress).all();

  // On web, restore from localStorage if in-memory DB is empty
  if (all.length === 0) {
    const backup = loadProgressFromLS();
    if (backup.length > 0) {
      // Re-insert into in-memory DB
      for (const p of backup) {
        try {
          db.insert(userProgress).values({
            word_id: p.word_id,
            quiz_mode: p.quiz_mode,
            correct_count: p.correct_count,
            wrong_count: p.wrong_count,
            last_reviewed_at: p.last_reviewed_at,
            next_review_at: p.next_review_at,
          }).run();
        } catch {}
      }
      all = db.select().from(userProgress).all();
    }
  }

  const totalCorrect = all.reduce((sum: number, r: any) => sum + (r.correct_count || 0), 0);
  const totalWrong = all.reduce((sum: number, r: any) => sum + (r.wrong_count || 0), 0);
  const total = totalCorrect + totalWrong;
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
  const wordsLearned = all.filter((r: any) => r.correct_count > 0).length;

  const today = new Date().toISOString().split("T")[0];
  const todayReviewed = all.filter(
    (r: any) => r.last_reviewed_at && r.last_reviewed_at.startsWith(today)
  ).length;

  return { totalReviewed: all.length, totalCorrect, totalWrong, accuracy, wordsLearned, todayReviewed };
}
