// Daily Session Planner - 1 hour/day split into activities

export type SessionActivity = {
  type: 'kana' | 'vocab' | 'grammar' | 'review' | 'quiz';
  title: string;
  duration: number; // minutes
  lesson?: number;
  data?: string[]; // card IDs to study
};

export type DailySession = {
  date: string; // YYYY-MM-DD
  activities: SessionActivity[];
  totalMinutes: number;
  completed: boolean;
};

export function generateDailySession(
  currentLesson: number,
  dueReviewCount: number,
  kanaProgress: number, // 0-100%
): DailySession {
  const activities: SessionActivity[] = [];
  let remaining = 60; // 60 minutes total

  // 1. Reviews first (most important for SRS)
  if (dueReviewCount > 0) {
    const reviewTime = Math.min(20, Math.ceil(dueReviewCount * 0.5));
    activities.push({
      type: 'review',
      title: `Ôn tập (${dueReviewCount} thẻ)`,
      duration: reviewTime,
    });
    remaining -= reviewTime;
  }

  // 2. Kana practice if not mastered
  if (kanaProgress < 100) {
    const kanaTime = Math.min(10, remaining);
    activities.push({
      type: 'kana',
      title: kanaProgress < 50 ? 'Học Hiragana' : 'Học Katakana',
      duration: kanaTime,
    });
    remaining -= kanaTime;
  }

  // 3. New vocabulary (current lesson)
  if (remaining > 0) {
    const vocabTime = Math.min(20, remaining);
    activities.push({
      type: 'vocab',
      title: `Từ vựng Bài ${currentLesson}`,
      duration: vocabTime,
      lesson: currentLesson,
    });
    remaining -= vocabTime;
  }

  // 4. Grammar
  if (remaining > 0) {
    const grammarTime = Math.min(15, remaining);
    activities.push({
      type: 'grammar',
      title: `Ngữ pháp Bài ${currentLesson}`,
      duration: grammarTime,
      lesson: currentLesson,
    });
    remaining -= grammarTime;
  }

  // 5. Quiz with remaining time
  if (remaining >= 5) {
    activities.push({
      type: 'quiz',
      title: 'Kiểm tra tổng hợp',
      duration: remaining,
    });
  }

  return {
    date: new Date().toISOString().split('T')[0],
    activities,
    totalMinutes: 60,
    completed: false,
  };
}

export function getStudyStreak(completedDates: string[]): number {
  if (!completedDates?.length) return 0;
  const sorted = [...completedDates].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
