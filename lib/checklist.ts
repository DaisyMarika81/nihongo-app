'use client';

const STORAGE_KEY = 'nihongo_checklist';

export type ChecklistItem = {
  id: string;
  label: string;
};

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'vocab', label: '📖 Đọc từ vựng' },
  { id: 'grammar', label: '📝 Học ngữ pháp' },
  { id: 'listen', label: '🔊 Nghe phát âm' },
  { id: 'flashcard', label: '📇 Ôn Flashcard' },
  { id: 'quiz', label: '✍️ Làm Quiz' },
];

export function getCheckedItems(lessonId: number): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(STORAGE_KEY);
  const data: Record<string, string[]> = raw ? JSON.parse(raw) : {};
  return new Set(data[lessonId] || []);
}

export function toggleCheckItem(lessonId: number, itemId: string): Set<string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data: Record<string, string[]> = raw ? JSON.parse(raw) : {};
  const current = new Set(data[lessonId] || []);
  if (current.has(itemId)) current.delete(itemId);
  else current.add(itemId);
  data[lessonId] = [...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return current;
}
