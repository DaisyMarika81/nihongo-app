// Spaced Repetition System (SM-2 algorithm variant)

export type CardState = {
  id: string;
  ease: number; // 1.3 - 3.0
  interval: number; // days until next review
  repetitions: number;
  nextReview: number; // timestamp
  lastReview: number;
};

export type ReviewResult = 'again' | 'hard' | 'good' | 'easy';

const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;

export function createCard(id: string): CardState {
  return {
    id,
    ease: INITIAL_EASE,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(),
    lastReview: 0,
  };
}

export function reviewCard(card: CardState, result: ReviewResult): CardState {
  const quality = { again: 0, hard: 1, good: 2, easy: 3 }[result];
  let { ease, interval, repetitions } = card;

  if (quality < 1) {
    // Failed - reset
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions++;
  }

  // Adjust ease
  ease = ease + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  // Bonus for easy
  if (result === 'easy') interval = Math.round(interval * 1.3);
  if (result === 'hard') interval = Math.max(1, Math.round(interval * 0.8));

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { ...card, ease, interval, repetitions, nextReview, lastReview: Date.now() };
}

export function isDue(card: CardState): boolean {
  return Date.now() >= card.nextReview;
}

export function getNewCards(allIds: string[], learned: CardState[], limit: number): string[] {
  const learnedSet = new Set(learned.map((c) => c.id));
  return allIds.filter((id) => !learnedSet.has(id)).slice(0, limit);
}

export function getDueCards(cards: CardState[]): CardState[] {
  return cards.filter(isDue).sort((a, b) => a.nextReview - b.nextReview);
}
