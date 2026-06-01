import { supabase } from './supabase';

// SRS state per session, stored in Supabase
// Key: session_num + type (e.g. "flashcard_3")

export type SessionSRSCard = {
  id: string; // e.g. "fc-3-0" (flashcard session 3 index 0)
  interval: number; // days
  nextReview: string; // ISO date YYYY-MM-DD
  repetitions: number;
};

const TABLE = 'session_srs';

export async function getSessionSRS(sessionNum: number, type: string): Promise<SessionSRSCard[]> {
  const { data } = await supabase
    .from(TABLE)
    .select('cards')
    .eq('session_num', sessionNum)
    .eq('type', type)
    .single();
  return data?.cards || [];
}

export async function saveSessionSRS(sessionNum: number, type: string, cards: SessionSRSCard[]): Promise<void> {
  await supabase
    .from(TABLE)
    .upsert({
      session_num: sessionNum,
      type,
      cards,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_num,type' });
}

export function markCard(cards: SessionSRSCard[], id: string, known: boolean): SessionSRSCard[] {
  const today = new Date().toISOString().split('T')[0];
  const existing = cards.find(c => c.id === id);

  if (existing) {
    if (known) {
      const intervals = [1, 3, 7, 14, 30];
      const nextIdx = Math.min(existing.repetitions, intervals.length - 1);
      const interval = intervals[nextIdx];
      const next = new Date();
      next.setDate(next.getDate() + interval);
      return cards.map(c => c.id === id ? { ...c, interval, nextReview: next.toISOString().split('T')[0], repetitions: c.repetitions + 1 } : c);
    } else {
      return cards.map(c => c.id === id ? { ...c, interval: 0, nextReview: today, repetitions: 0 } : c);
    }
  } else {
    // New card
    if (known) {
      const next = new Date();
      next.setDate(next.getDate() + 1);
      return [...cards, { id, interval: 1, nextReview: next.toISOString().split('T')[0], repetitions: 1 }];
    } else {
      return [...cards, { id, interval: 0, nextReview: today, repetitions: 0 }];
    }
  }
}

export function getDueCount(cards: SessionSRSCard[]): number {
  const today = new Date().toISOString().split('T')[0];
  return cards.filter(c => c.nextReview <= today).length;
}
