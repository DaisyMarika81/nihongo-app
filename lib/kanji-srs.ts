// Kanji SRS with response time factor

export type KanjiSRSCard = {
  kanji: string;
  srsLevel: number;
  easeFactor: number;
  lastReviewed: string;
  nextReviewDate: string;
  history: { date: string; result: 'correct' | 'wrong'; responseTimeMs: number }[];
};

const INTERVALS = [1, 3, 7, 14, 30, 60]; // days per level

export function createKanjiCard(kanji: string): KanjiSRSCard {
  return {
    kanji,
    srsLevel: 0,
    easeFactor: 2.5,
    lastReviewed: '',
    nextReviewDate: new Date().toISOString().split('T')[0],
    history: [],
  };
}

export function reviewKanjiCard(card: KanjiSRSCard, correct: boolean, responseTimeMs: number): KanjiSRSCard {
  const today = new Date().toISOString().split('T')[0];
  const history = [...card.history, { date: today, result: correct ? 'correct' as const : 'wrong' as const, responseTimeMs }];

  if (!correct) {
    // Reset to level 0
    return { ...card, srsLevel: 0, easeFactor: Math.max(1.3, card.easeFactor - 0.2), lastReviewed: today, nextReviewDate: addDays(today, 1), history };
  }

  // Correct: check response time
  const isFast = responseTimeMs < 3000; // under 3s = fast
  let newLevel = card.srsLevel + 1;
  let newEase = card.easeFactor;

  if (isFast) {
    newEase = Math.min(3.0, newEase + 0.1); // boost ease for fast response
  } else if (responseTimeMs > 8000) {
    newEase = Math.max(1.3, newEase - 0.1); // slow = weaker memory
    newLevel = Math.max(card.srsLevel, newLevel - 1); // don't advance as much
  }

  const interval = INTERVALS[Math.min(newLevel, INTERVALS.length - 1)];
  const adjustedInterval = Math.round(interval * (newEase / 2.5));

  return { ...card, srsLevel: newLevel, easeFactor: newEase, lastReviewed: today, nextReviewDate: addDays(today, adjustedInterval), history };
}

export function isDueToday(card: KanjiSRSCard): boolean {
  const today = new Date().toISOString().split('T')[0];
  return card.nextReviewDate <= today;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
