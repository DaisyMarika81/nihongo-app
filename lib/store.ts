'use client';

import { CardState, createCard, reviewCard, getDueCards, getNewCards, ReviewResult } from './srs';

const STORAGE_KEY = 'nihongo_progress';

export type Progress = {
  cards: CardState[];
  currentLesson: number;
  completedDates: string[];
  kanaProgress: number; // 0-100
  totalReviews: number;
  todayReviews: number;
  todayDate: string;
};

function defaultProgress(): Progress {
  return {
    cards: [],
    currentLesson: 1,
    completedDates: [],
    kanaProgress: 0,
    totalReviews: 0,
    todayReviews: 0,
    todayDate: new Date().toISOString().split('T')[0],
  };
}

export function loadProgress(): Progress {
  if (typeof window === 'undefined') return defaultProgress();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultProgress();
  const p = JSON.parse(raw) as Progress;
  // Reset daily counter if new day
  const today = new Date().toISOString().split('T')[0];
  if (p.todayDate !== today) {
    p.todayReviews = 0;
    p.todayDate = today;
  }
  return p;
}

export function saveProgress(progress: Progress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function learnCard(progress: Progress, cardId: string): Progress {
  const existing = progress.cards.find((c) => c.id === cardId);
  if (existing) return progress;
  return {
    ...progress,
    cards: [...progress.cards, createCard(cardId)],
  };
}

export function reviewCardProgress(progress: Progress, cardId: string, result: ReviewResult): Progress {
  const cards = progress.cards.map((c) =>
    c.id === cardId ? reviewCard(c, result) : c
  );
  return {
    ...progress,
    cards,
    totalReviews: progress.totalReviews + 1,
    todayReviews: progress.todayReviews + 1,
  };
}

export function getDueCount(progress: Progress): number {
  return getDueCards(progress.cards).length;
}

export function getNewCardIds(allIds: string[], progress: Progress, limit = 10): string[] {
  return getNewCards(allIds, progress.cards, limit);
}

export function markDayComplete(progress: Progress): Progress {
  const today = new Date().toISOString().split('T')[0];
  if (progress.completedDates.includes(today)) return progress;
  return {
    ...progress,
    completedDates: [...progress.completedDates, today],
  };
}

export function advanceLesson(progress: Progress): Progress {
  return { ...progress, currentLesson: Math.min(50, progress.currentLesson + 1) };
}

export function updateKanaProgress(progress: Progress, percent: number): Progress {
  return { ...progress, kanaProgress: Math.min(100, percent) };
}
