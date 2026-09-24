'use client';

import { ImportedFlashcard, ImportedFlashcardType, loadImportedFlashcards, parseImportedFlashcards } from './imported-flashcards';

export type FlashcardSession = {
  id: string;
  name: string;
  createdAt: number;
  cards: ImportedFlashcard[];
};

const SESSIONS_KEY = 'nihongo_flashcard_sessions_v1';
const ACTIVE_SESSION_KEY = 'nihongo_active_flashcard_session_v1';

function defaultSession(): FlashcardSession {
  return { id: `session-${Date.now()}`, name: 'Session 1', createdAt: Date.now(), cards: [] };
}

export function loadSessions(): FlashcardSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) {
      const sessions = JSON.parse(raw) as FlashcardSession[];
      if (Array.isArray(sessions) && sessions.length > 0) return sessions;
    }
    const legacyCards = loadImportedFlashcards();
    const first = defaultSession();
    first.cards = legacyCards;
    const sessions = [first];
    saveSessions(sessions);
    setActiveSessionId(first.id);
    return sessions;
  } catch {
    return [];
  }
}

export function saveSessions(sessions: FlashcardSession[]) {
  if (typeof window !== 'undefined') localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function setActiveSessionId(id: string) {
  if (typeof window !== 'undefined') localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

export function createSession(name?: string): FlashcardSession {
  const sessions = loadSessions();
  const session: FlashcardSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name?.trim() || `Session ${sessions.length + 1}`,
    createdAt: Date.now(),
    cards: [],
  };
  saveSessions([...sessions, session]);
  setActiveSessionId(session.id);
  return session;
}

export function getActiveSession(sessions = loadSessions()): FlashcardSession | undefined {
  const activeId = getActiveSessionId();
  return sessions.find((session) => session.id === activeId) || sessions[0];
}

export function importCardsIntoSession(json: string, type: ImportedFlashcardType, sessionId: string) {
  const incoming = parseImportedFlashcards(json, type);
  const sessions = loadSessions();
  const target = sessions.find((session) => session.id === sessionId);
  if (!target) throw new Error('Không tìm thấy session đang chọn.');
  const keys = new Set(target.cards.map((card) => `${card.type}:${card.kanji}:${card.hiragana}`));
  const fresh = incoming.filter((card) => !keys.has(`${card.type}:${card.kanji}:${card.hiragana}`));
  target.cards = [...target.cards, ...fresh];
  saveSessions(sessions);
  return { incoming, fresh };
}

export function removeCardsFromSession(sessionId: string, type?: ImportedFlashcardType) {
  const sessions = loadSessions();
  const target = sessions.find((session) => session.id === sessionId);
  if (!target) return;
  target.cards = type ? target.cards.filter((card) => card.type !== type) : [];
  saveSessions(sessions);
}

export function updateSession(sessionId: string, cards: ImportedFlashcard[]) {
  const sessions = loadSessions();
  const target = sessions.find((session) => session.id === sessionId);
  if (target) { target.cards = cards; saveSessions(sessions); }
}

export function deleteSession(sessionId: string) {
  const sessions = loadSessions().filter((session) => session.id !== sessionId);
  if (sessions.length === 0) {
    const fresh = defaultSession();
    saveSessions([fresh]);
    setActiveSessionId(fresh.id);
  } else {
    saveSessions(sessions);
    if (getActiveSessionId() === sessionId) setActiveSessionId(sessions[0].id);
  }
}
