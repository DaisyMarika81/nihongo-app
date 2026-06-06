import { supabase } from './supabase';

export type SessionSRSCard = {
  id: string;
  interval: number;
  nextReview: string;
  repetitions: number;
};

type SessionSRSData = {
  cards: SessionSRSCard[];
  done: number[];
  unknown: number[];
};

const TABLE = 'session_srs';

export async function getSessionSRS(sessionNum: number, type: string): Promise<SessionSRSData> {
  const { data } = await supabase
    .from(TABLE)
    .select('cards')
    .eq('session_num', sessionNum)
    .eq('type', type)
    .single();
  const raw = data?.cards as SessionSRSData | SessionSRSCard[] | null;
  if (!raw) return { cards: [], done: [], unknown: [] };
  if (Array.isArray(raw)) return { cards: raw, done: [], unknown: [] };
  return { cards: raw.cards || [], done: raw.done || [], unknown: raw.unknown || [] };
}

export async function saveSessionSRS(sessionNum: number, type: string, data: SessionSRSData): Promise<void> {
  await supabase
    .from(TABLE)
    .upsert({
      session_num: sessionNum,
      type,
      cards: data,
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
