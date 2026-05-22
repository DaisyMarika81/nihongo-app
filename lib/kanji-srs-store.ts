'use client';

import { KanjiSRSCard, createKanjiCard, reviewKanjiCard, isDueToday } from './kanji-srs';

const STORAGE_KEY = 'nihongo_kanji_srs';

export function loadKanjiSRS(): Record<string, KanjiSRSCard> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function saveKanjiSRS(data: Record<string, KanjiSRSCard>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addKanjiToSRS(kanji: string) {
  const data = loadKanjiSRS();
  if (!data[kanji]) data[kanji] = createKanjiCard(kanji);
  saveKanjiSRS(data);
}

export function reviewKanji(kanji: string, correct: boolean, responseTimeMs: number) {
  const data = loadKanjiSRS();
  if (!data[kanji]) data[kanji] = createKanjiCard(kanji);
  data[kanji] = reviewKanjiCard(data[kanji], correct, responseTimeMs);
  saveKanjiSRS(data);
  return data[kanji];
}

export function getDueKanji(): KanjiSRSCard[] {
  const data = loadKanjiSRS();
  return Object.values(data).filter(isDueToday);
}

export function getKanjiStats() {
  const data = loadKanjiSRS();
  const all = Object.values(data);
  return {
    total: all.length,
    due: all.filter(isDueToday).length,
    mastered: all.filter((c) => c.srsLevel >= 5).length,
  };
}
