'use client';

const BOOKMARK_KEY = 'nihongo_bookmarks';

export type BookmarkItem = {
  id: string;
  japanese: string;
  reading: string;
  meaning: string;
  type: 'vocab' | 'kanji';
};

export function getBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(BOOKMARK_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addBookmark(item: BookmarkItem): void {
  const list = getBookmarks();
  if (list.some((b) => b.id === item.id)) return;
  list.push(item);
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list));
}

export function removeBookmark(id: string): void {
  const list = getBookmarks().filter((b) => b.id !== id);
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list));
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some((b) => b.id === id);
}
