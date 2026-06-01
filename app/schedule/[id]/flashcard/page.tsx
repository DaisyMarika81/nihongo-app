'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { speak } from '@/lib/speak';
import { sessionCards, SessionCard } from '@/data/session-cards';
import { getSessionData, deleteSessionItem } from '@/lib/session-data';
import { supabase } from '@/lib/supabase';

import { getSessionSRS, saveSessionSRS, markCard, SessionSRSCard } from '@/lib/session-srs';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Mode = 'flashcard' | 'quiz' | 'unknown';

export default function SessionFlashCard() {
  const { id } = useParams();
  const sessionId = parseInt(id as string);
  const baseCards = sessionCards[sessionId] || [];
  const STORAGE_KEY = `nihongo_session${sessionId}_state`;

  const [cards, setCards] = useState<SessionCard[]>(baseCards);

  useEffect(() => {
    getSessionData(sessionId, 'flashcard').then(data => {
      if ((data as SessionCard[]).length) setCards([...baseCards, ...(data as SessionCard[])]);
    });
  }, [sessionId]);

  const [mode, setMode] = useState<Mode>('flashcard');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [quizCards, setQuizCards] = useState<typeof cards>([]);
  const [qIndex, setQIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [qScore, setQScore] = useState({ correct: 0, total: 0 });
  const [quizDone, setQuizDone] = useState(false);

  const reviewed = new Set([...done, ...unknown]);
  const remaining = cards.length - reviewed.size;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { done: d, unknown: u } = JSON.parse(saved);
      if (d) setDone(new Set(d));
      if (u) setUnknown(new Set(u));
    }
  }, [STORAGE_KEY]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (mode !== 'flashcard' || remaining === 0) return;
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, remaining]);

  const [srsCards, setSrsCards] = useState<SessionSRSCard[]>([]);

  useEffect(() => {
    getSessionSRS(sessionId, 'flashcard').then(setSrsCards);
  }, [sessionId]);

  function saveState(d: Set<number>, u: Set<number>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ done: [...d], unknown: [...u] }));
  }

  function next(known: boolean) {
    const newUnknown = new Set(unknown);
    const newDone = new Set(done);
    if (!known) newUnknown.add(index);
    if (known) newDone.add(index);
    setUnknown(newUnknown);
    setDone(newDone);
    saveState(newDone, newUnknown);

    // SRS tracking
    const cardId = `fc-${sessionId}-${index}`;
    const updated = markCard(srsCards, cardId, known);
    setSrsCards(updated);
    saveSessionSRS(sessionId, 'flashcard', updated);

    setFlipped(false);
    setTimeout(() => {
      const allReviewed = new Set([...newDone, ...newUnknown]);
      if (allReviewed.size >= cards.length) return;
      let n = (index + 1) % cards.length;
      while (allReviewed.has(n)) n = (n + 1) % cards.length;
      setIndex(n);
    }, 300);
  }

  function reset() { setDone(new Set()); setUnknown(new Set()); setIndex(0); setFlipped(false); setMode('flashcard'); localStorage.removeItem(STORAGE_KEY); }

  function generateOptions(pool: typeof cards, idx: number) {
    const correct = pool[idx].vietnamese;
    const wrong = shuffle(cards.filter((c) => c.vietnamese !== correct)).slice(0, 3).map((c) => c.vietnamese);
    setOptions(shuffle([correct, ...wrong]));
  }

  function startQuiz() {
    const pool = unknown.size > 0 ? [...unknown].map((i) => cards[i]) : cards;
    const shuffled = shuffle(pool);
    setQuizCards(shuffled);
    setQIndex(0);
    setQScore({ correct: 0, total: 0 });
    setSelected(null);
    setQuizDone(false);
    generateOptions(shuffled, 0);
    setMode('quiz');
  }

  function handleQuizAnswer(i: number) {
    if (selected !== null) return;
    setSelected(i);
    const isCorrect = options[i] === quizCards[qIndex].vietnamese;
    setQScore({ correct: qScore.correct + (isCorrect ? 1 : 0), total: qScore.total + 1 });
    setTimeout(() => {
      if (qIndex + 1 >= quizCards.length) { setQuizDone(true); }
      else { setSelected(null); const n = qIndex + 1; setQIndex(n); generateOptions(quizCards, n); }
    }, 1200);
  }

  const [managing, setManaging] = useState(false);

  async function handleDeleteCard(idx: number) {
    if (!confirm(`Xóa "${cards[idx].japanese}"?`)) return;
    const baseLen = baseCards.length;
    if (idx >= baseLen) {
      await deleteSessionItem(sessionId, 'flashcard', idx - baseLen);
    }
    setCards(cards.filter((_, i) => i !== idx));
  }

  if (!cards.length) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <p className="text-4xl mb-4">📭</p>
        <p className="text-lg font-bold text-gray-800">Buổi {sessionId} chưa có flashcard</p>
        <p className="text-sm text-gray-500 mt-2">Thêm data vào file data/session-cards.ts</p>
      </div>
    );
  }

  // === MANAGE (delete) ===
  if (managing) {
    function exportFlashcard() {
      const json = JSON.stringify(cards, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashcard-buoi-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">🗑️ Quản lý từ ({cards.length})</h1>
          <button onClick={() => setManaging(false)} className="text-sm text-gray-500">← Quay lại</button>
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={exportFlashcard} className="px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl text-sm font-medium shadow">📤 Export JSON</button>
          <button onClick={async () => { if (!confirm(`Xóa tất cả ${cards.length} từ buổi ${sessionId}?`)) return; await supabase.from('session_data').delete().eq('session_num', sessionId).eq('type', 'flashcard'); setCards([]); setManaging(false); }} className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl text-sm font-medium shadow">🗑️ Xóa tất cả</button>
        </div>
        <div className="space-y-2">
          {cards.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div>
                <span className="font-bold text-gray-800">{c.japanese}</span>
                <span className="text-sm text-gray-500 ml-2">{c.vietnamese}</span>
              </div>
              <button onClick={() => handleDeleteCard(i)} className="text-xs px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">🗑️</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // === UNKNOWN LIST ===
  if (mode === 'unknown') {
    const unknownCards = [...unknown].map((i) => cards[i]);
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">❌ Chưa thuộc ({unknownCards.length})</h1>
          <button onClick={() => setMode('flashcard')} className="text-sm text-gray-500">← Quay lại</button>
        </div>
        <div className="space-y-2">
          {unknownCards.map((c, i) => {
            const originalIndex = [...unknown][i];
            return (
              <div key={i} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <button onClick={() => speak(c.japanese)} className="text-lg">🔊</button>
                  <div>
                    <span className="font-bold text-gray-800">{c.japanese}</span>
                    <div className="text-sm text-gray-500">{c.vietnamese}</div>
                  </div>
                </div>
                <button onClick={() => {
                  const nu = new Set(unknown); nu.delete(originalIndex);
                  const nd = new Set(done); nd.add(originalIndex);
                  setUnknown(nu); setDone(nd); saveState(nd, nu);
                }} className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg font-medium">✓ Thuộc</button>
              </div>
            );
          })}
        </div>
        {unknownCards.length > 0 && (
          <button onClick={startQuiz} className="mt-6 w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow">✍️ Trắc nghiệm</button>
        )}
      </div>
    );
  }

  // === QUIZ ===
  if (mode === 'quiz') {
    if (quizDone) {
      return (
        <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-xl font-bold text-gray-800">Kết quả trắc nghiệm</p>
          <p className="text-3xl font-bold text-indigo-600 mt-3">{qScore.correct}/{qScore.total}</p>
          <p className="text-sm text-gray-500 mt-1">{Math.round((qScore.correct / qScore.total) * 100)}% đúng</p>
          <div className="flex gap-3 mt-6">
            <button onClick={startQuiz} className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow">Làm lại</button>
            <button onClick={() => setMode('flashcard')} className="px-5 py-2 bg-gray-200 rounded-xl font-medium">Quay lại</button>
          </div>
        </div>
      );
    }
    const q = quizCards[qIndex];
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">✍️ Trắc nghiệm</h1>
        <p className="text-sm text-gray-500 mb-6">Câu {qIndex + 1}/{quizCards.length} • Đúng: {qScore.correct}</p>
        <div className="bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl px-8 py-10 mb-6 shadow-xl">
          <span className="text-3xl font-bold" style={{ color: '#fff' }}>{q.japanese}</span>
        </div>
        <div className="w-full max-w-sm space-y-3">
          {options.map((opt, i) => {
            let cls = 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300';
            if (selected !== null) {
              if (opt === q.vietnamese) cls = 'bg-emerald-100 border-2 border-emerald-400 text-emerald-700';
              else if (i === selected) cls = 'bg-red-100 border-2 border-red-400 text-red-700';
            }
            return (
              <button key={i} onClick={() => handleQuizAnswer(i)} disabled={selected !== null}
                className={`${cls} w-full py-3 px-4 rounded-xl font-medium text-left transition-all shadow-sm`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === SUMMARY ===
  if (remaining === 0) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-xl font-bold text-gray-800">Tổng kết Buổi {sessionId}</p>
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-emerald-600">✅ Đã thuộc: <span className="font-bold">{done.size}</span></p>
          <p className="text-red-500">❌ Chưa thuộc: <span className="font-bold">{unknown.size}</span></p>
          <p className="text-gray-500">📊 Tỉ lệ: <span className="font-bold">{Math.round((done.size / cards.length) * 100)}%</span></p>
        </div>
        <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
          {unknown.size > 0 && <button onClick={() => setMode('unknown')} className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-medium">❌ Từ chưa thuộc ({unknown.size})</button>}
          <button onClick={startQuiz} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow">✍️ Trắc nghiệm</button>
          <button onClick={reset} className="w-full py-3 bg-gray-200 rounded-xl font-medium">🔄 Học lại</button>
        </div>
      </div>
    );
  }

  // === FLASHCARD ===
  const card = cards[index];
  return (
    <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
      <h1 className="text-xl font-bold text-gray-800 mb-2">📖 Buổi {sessionId} - Flashcard</h1>
      <p className="text-sm text-gray-500 mb-1">Còn {remaining}/{cards.length}</p>
      <div className="flex gap-3 mb-4">
        {unknown.size > 0 && <button onClick={() => setMode('unknown')} className="text-xs text-red-400">❌ Chưa thuộc: {unknown.size}</button>}
        <button onClick={() => setManaging(true)} className="text-xs text-gray-400 hover:text-red-500">🗑️ Quản lý</button>
      </div>

      <div className="w-72 sm:w-80 h-52 cursor-pointer [perspective:1000px] mb-4" onClick={() => setFlipped(!flipped)}>
        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-xl [backface-visibility:hidden]">
            <span className="text-3xl font-bold" style={{ color: '#fff' }}>{card.japanese}</span>
            <button onClick={(e) => { e.stopPropagation(); speak(card.japanese); }} className="mt-3 text-xl opacity-80 hover:opacity-100" style={{ color: '#fff' }}>🔊</button>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-2xl font-bold" style={{ color: '#fff' }}>{card.vietnamese}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-4">{flipped ? '' : 'Space = lật thẻ'}</p>

      <div className="flex gap-3">
        <button onClick={() => next(false)} className="px-5 py-2 rounded-xl bg-red-400 text-white font-medium shadow">Chưa thuộc</button>
        <button onClick={() => setFlipped(!flipped)} className="px-5 py-2 rounded-xl bg-gray-300 text-gray-700 font-medium">Lật</button>
        <button onClick={() => next(true)} className="px-5 py-2 rounded-xl bg-emerald-400 text-white font-medium shadow">Đã thuộc ✓</button>
      </div>

      <div className="mt-6 w-full max-w-sm">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${(done.size / cards.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
