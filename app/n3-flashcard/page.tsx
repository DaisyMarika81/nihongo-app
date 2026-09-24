'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import FlashCard from '@/app/components/FlashCard';
import { FlashcardSession, createSession, getActiveSession, loadSessions, setActiveSessionId } from '@/lib/flashcard-sessions';

export default function N3FlashcardPage() {
  const [sessions, setSessions] = useState<FlashcardSession[]>([]);
  const [activeId, setActiveId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ready, setReady] = useState(false);

  function refresh() {
    const loaded = loadSessions();
    const active = getActiveSession(loaded);
    setSessions(loaded);
    if (active) { setActiveId(active.id); setActiveSessionId(active.id); }
    setCurrentIndex(0);
  }

  useEffect(() => { window.setTimeout(() => { refresh(); setReady(true); }, 0); }, []);

  const session = useMemo(() => sessions.find((item) => item.id === activeId) || sessions[0], [sessions, activeId]);

  function selectSession(id: string) {
    setActiveId(id); setActiveSessionId(id); setCurrentIndex(0);
  }

  function addSession() {
    const created = createSession();
    setSessions(loadSessions()); setActiveId(created.id); setCurrentIndex(0);
  }

  if (!ready || !session) return <div className="flex items-center justify-center min-h-[70vh] text-gray-400">Đang tải session...</div>;
  const cards = session.cards;

  return (
    <main className="min-h-screen p-4 pb-24 max-w-2xl mx-auto flex flex-col items-center justify-center">
      <div className="w-full flex items-center justify-between mb-5">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Trang chủ</Link>
        <span className="text-sm font-semibold text-indigo-500">Luyện N3 flashcard</span>
        <Link href="/import-flashcards" className="text-sm text-gray-400 hover:text-gray-600">Import</Link>
      </div>

      <div className="w-full flex items-center gap-2 mb-6 overflow-x-auto pb-1" aria-label="Các session">
        {sessions.map((item) => (
          <button key={item.id} type="button" onClick={() => selectSession(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${item.id === session.id ? 'bg-indigo-500 text-white shadow' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'}`}>
            {item.name} <span className="opacity-70">({item.cards.length})</span>
          </button>
        ))}
        <button type="button" onClick={addSession} className="shrink-0 h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 text-xl font-semibold hover:bg-indigo-200" aria-label="Tạo session mới">+</button>
      </div>

      {cards.length === 0 ? (
        <div className="w-full rounded-3xl bg-white/80 border border-indigo-100 p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🈁</p>
          <h1 className="text-xl font-bold text-gray-800">{session.name} chưa có thẻ</h1>
          <p className="text-sm text-gray-500 mt-2">Import Kanji JSON để thêm thẻ vào đúng session đang chọn.</p>
          <Link href="/import-flashcards" className="inline-block mt-5 px-5 py-3 rounded-xl bg-indigo-500 text-white font-semibold shadow hover:bg-indigo-600">📥 Import vào session</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-6 font-medium">{currentIndex + 1} / {cards.length} thẻ</p>
          <FlashCard key={cards[currentIndex].id} front={cards[currentIndex].kanji} reading={cards[currentIndex].hiragana} meaning={cards[currentIndex].meaning} />
          <div className="flex items-center gap-3 mt-7">
            <button type="button" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="h-11 w-11 rounded-xl border border-gray-200 bg-white text-gray-700 text-xl font-semibold shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Thẻ trước">←</button>
            <button type="button" onClick={() => setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1))} disabled={currentIndex === cards.length - 1} className="h-11 w-11 rounded-xl bg-indigo-500 text-white text-xl font-semibold shadow-sm hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Thẻ tiếp theo">→</button>
          </div>
          <p className="text-xs text-gray-400 mt-4">Bấm vào thẻ để lật xem hiragana và nghĩa</p>
        </>
      )}
    </main>
  );
}
