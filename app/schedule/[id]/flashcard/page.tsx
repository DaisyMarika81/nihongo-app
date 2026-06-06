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

  function prevCard() {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }

  function nextCard() {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (mode !== 'flashcard' || remaining === 0) return;
      if (e.code === 'Space') { e.preventDefault(); next(true); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); prevCard(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); nextCard(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, remaining, cards.length, index]);

  const [srsCards, setSrsCards] = useState<SessionSRSCard[]>([]);

  useEffect(() => {
    getSessionSRS(sessionId, 'flashcard').then(data => {
      setSrsCards(data.cards);
      if (data.done.length || data.unknown.length) {
        setDone(new Set(data.done));
        setUnknown(new Set(data.unknown));
      }
    });
  }, [sessionId]);

  function saveState(d: Set<number>, u: Set<number>, cards?: SessionSRSCard[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ done: [...d], unknown: [...u] }));
    saveSessionSRS(sessionId, 'flashcard', { cards: cards || srsCards, done: [...d], unknown: [...u] });
  }

  function persistState(d: Set<number>, u: Set<number>, cards: SessionSRSCard[]) {
    saveSessionSRS(sessionId, 'flashcard', { cards, done: [...d], unknown: [...u] });
  }

  function next(known: boolean) {
    const newUnknown = new Set(unknown);
    const newDone = new Set(done);
    if (!known) newUnknown.add(index);
    if (known) newDone.add(index);
    setUnknown(newUnknown);
    setDone(newDone);

    // SRS tracking
    const cardId = `fc-${sessionId}-${index}`;
    const updated = markCard(srsCards, cardId, known);
    setSrsCards(updated);
    persistState(newDone, newUnknown, updated);

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

  function getMeaning(c: SessionCard) { return c.meaning || c.vietnamese; }

  function generateOptions(pool: typeof cards, idx: number) {
    const correct = getMeaning(pool[idx]);
    const wrong = shuffle(cards.filter((c) => getMeaning(c) !== correct)).slice(0, 3).map((c) => getMeaning(c));
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
    const isCorrect = options[i] === getMeaning(quizCards[qIndex]);
    setQScore({ correct: qScore.correct + (isCorrect ? 1 : 0), total: qScore.total + 1 });
    setTimeout(() => {
      if (qIndex + 1 >= quizCards.length) { setQuizDone(true); }
      else { setSelected(null); const n = qIndex + 1; setQIndex(n); generateOptions(quizCards, n); }
    }, 1200);
  }

  const [managing, setManaging] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<SessionCard>>({});

  async function handleDeleteCard(idx: number) {
    if (!confirm(`Xóa "${cards[idx].japanese}"?`)) return;
    const baseLen = baseCards.length;
    if (idx >= baseLen) {
      await deleteSessionItem(sessionId, 'flashcard', idx - baseLen);
    }
    setCards(cards.filter((_, i) => i !== idx));
  }

  function startEdit(idx: number) {
    setEditIdx(idx);
    setEditData({ ...cards[idx] });
  }

  async function saveEdit() {
    if (editIdx === null) return;
    const updated = cards.map((c, i) => i === editIdx ? { ...c, ...editData } as SessionCard : c);
    setCards(updated);
    const baseLen = baseCards.length;
    if (editIdx >= baseLen) {
      const dbItems = updated.slice(baseLen);
      await supabase.from('session_data').update({ items: dbItems, updated_at: new Date().toISOString() }).eq('session_num', sessionId).eq('type', 'flashcard');
    }
    setEditIdx(null);
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
          {cards.map((c, i) => {
            const isRich = 'kanji' in c && c.kanji;
            if (editIdx === i) {
              return (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-medium">{isRich ? 'Kanji' : 'Japanese'}</label>
                      <input value={isRich ? (editData.kanji || '') : (editData.japanese || '')} onChange={e => setEditData({ ...editData, ...(isRich ? { kanji: e.target.value } : { japanese: e.target.value }) })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    {isRich && (
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 font-medium">Hiragana</label>
                        <input value={editData.hiragana || ''} onChange={e => setEditData({ ...editData, hiragana: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-sm" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-medium">Nghĩa</label>
                    <input value={isRich ? (editData.meaning || '') : (editData.vietnamese || '')} onChange={e => setEditData({ ...editData, ...(isRich ? { meaning: e.target.value } : { vietnamese: e.target.value }) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg">💾 Lưu</button>
                    <button onClick={() => setEditIdx(null)} className="text-xs px-3 py-1.5 bg-gray-200 rounded-lg">Hủy</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div>
                  <span className="font-bold text-gray-800">{c.kanji || c.japanese}</span>
                  {c.hiragana && <span className="text-sm text-gray-400 ml-1">({c.hiragana})</span>}
                  <span className="text-sm text-gray-500 ml-2">{c.meaning || c.vietnamese}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(i)} className="text-xs px-2 py-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">✏️</button>
                  <button onClick={() => handleDeleteCard(i)} className="text-xs px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">🗑️</button>
                </div>
              </div>
            );
          })}
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
                  <button onClick={() => speak(c.kanji || c.japanese)} className="text-lg">🔊</button>
                  <div>
                    <span className="font-bold text-gray-800">{c.kanji || c.japanese}</span>
                    <span className="text-sm text-gray-400 ml-1">{c.hiragana || ''}</span>
                    <div className="text-sm text-gray-500">{c.meaning || c.vietnamese}</div>
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
        <div className="bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl px-8 py-6 mb-6 shadow-xl text-center">
          {q.kanji ? (
            <>
              <span className="text-3xl font-bold" style={{ color: '#fff' }}>{q.kanji}</span>
              <div className="text-sm mt-1 opacity-80" style={{ color: '#fff' }}>{q.hiragana}</div>
            </>
          ) : (
            <span className="text-3xl font-bold" style={{ color: '#fff' }}>{q.japanese}</span>
          )}
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

  // === FLASHCARD (no flip) ===
  const card = cards[index];
  const isRich = 'kanji' in card && card.kanji;

  return (
    <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-md mb-2">
        <h1 className="text-xl font-bold text-gray-800">📖 Buổi {sessionId}</h1>
        <div className="flex gap-3 items-center">
          {unknown.size > 0 && <button onClick={() => setMode('unknown')} className="text-xs text-red-400">❌ {unknown.size}</button>}
          <button onClick={() => setManaging(true)} className="text-xs text-gray-400 hover:text-red-500">🗑️</button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">Còn {remaining}/{cards.length}</p>

      {isRich ? (
        <div className="w-full max-w-md rounded-2xl shadow-xl p-6 text-white mb-4" style={{ background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-4xl font-bold">{card.kanji}</h2>
              <p className="text-xl mt-1 opacity-90">{card.hiragana}</p>
              {card.romaji && <p className="text-sm mt-0.5 opacity-70 italic">{card.romaji}</p>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); speak(card.kanji!); }} className="text-2xl opacity-80 hover:opacity-100 hover:scale-125 transition-transform">🔊</button>
          </div>
          <div className="mt-4 text-lg font-medium border-t border-white/20 pt-3">
            {card.meaning || card.vietnamese}
          </div>
          <div className="mt-3 text-sm bg-white/10 rounded-xl p-3 min-h-[48px]">
            {card.antonym ? (
              <><span className="font-semibold">Trái nghĩa:</span>{' '}
              <span className="font-medium">{card.antonym.kanji}</span> ({card.antonym.hiragana}) – {card.antonym.meaning}</>
            ) : <span className="opacity-0">Trái nghĩa:</span>}
          </div>
          {card.examples && card.examples.length > 0 && (
            <div className="mt-3">
              <button onClick={() => setFlipped(!flipped)} className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
                <span>📝 Ví dụ ({card.examples.length})</span>
                <span className={`text-xs transition-transform ${flipped ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {flipped && (
                <div className="mt-2 space-y-2">
                  {card.examples.map((ex, i) => (
                    <div key={i} className="bg-white/10 rounded-xl p-3">
                      <div className="flex items-start justify-between">
                        <p className="font-medium">{ex.japanese}</p>
                        <button onClick={(e) => { e.stopPropagation(); speak(ex.japanese); }} className="text-sm opacity-70 hover:opacity-100 ml-2 shrink-0">🔊</button>
                      </div>
                      <p className="text-xs opacity-70 mt-0.5">{ex.hiragana}</p>
                      <p className="text-xs opacity-50 italic">{ex.romaji}</p>
                      <p className="text-xs mt-1.5 border-t border-white/10 pt-1.5">{ex.meaning_vi}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl shadow-xl p-8 text-white mb-4 flex flex-col items-center" style={{ background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)' }}>
          <h2 className="text-3xl font-bold">{card.japanese}</h2>
          <button onClick={(e) => { e.stopPropagation(); speak(card.japanese); }} className="mt-3 text-xl opacity-80 hover:opacity-100 hover:scale-125 transition-transform">🔊</button>
          <div className="mt-4 text-lg font-medium border-t border-white/20 pt-3 text-center">
            {card.vietnamese}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between w-full max-w-md mb-2">
        <button onClick={prevCard} className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">◀</button>
        <span className="text-xs text-gray-400 font-medium">{index + 1} / {cards.length}</span>
        <button onClick={nextCard} className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">▶</button>
      </div>

      <div className="flex gap-3">
        <button onClick={() => next(false)} className="px-5 py-2 rounded-xl bg-red-400 text-white font-medium shadow">Chưa thuộc</button>
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
