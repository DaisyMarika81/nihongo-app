'use client';

const NOTES_KEY = 'nihongo_notes';

export function getNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(NOTES_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function getNote(id: string): string {
  return getNotes()[id] || '';
}

export function saveNote(id: string, text: string): void {
  const notes = getNotes();
  if (text.trim()) notes[id] = text.trim();
  else delete notes[id];
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
