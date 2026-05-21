'use client';

import { useState, useEffect } from 'react';
import { getBookmarks, removeBookmark, BookmarkItem } from '@/lib/bookmarks';
import { speak } from '@/lib/speak';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => { setBookmarks(getBookmarks()); }, []);

  function handleRemove(id: string) {
    removeBookmark(id);
    setBookmarks(getBookmarks());
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">⭐ Từ khó</h1>
      <p className="text-sm text-gray-500 mb-6">{bookmarks.length} từ đã đánh dấu</p>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📌</p>
          <p>Chưa có từ nào. Nhấn ⭐ trong bài học để thêm.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((b) => (
            <div key={b.id} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <button onClick={() => speak(b.japanese)} className="text-lg hover:scale-125 transition-transform">🔊</button>
                <div>
                  <ruby className="text-lg font-bold text-gray-800">
                    {b.japanese}<rp>(</rp><rt className="text-xs text-indigo-400 font-normal">{b.reading}</rt><rp>)</rp>
                  </ruby>
                  <div className="text-sm text-gray-500">{b.meaning}</div>
                </div>
              </div>
              <button onClick={() => handleRemove(b.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
