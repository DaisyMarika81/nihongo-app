'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { speak } from '@/lib/speak';
import { sessionCards, SessionCard } from '@/data/session-cards';
import { getSessionData, deleteSessionItem } from '@/lib/session-data';
import { supabase } from '@/lib/supabase';

import { getSessionSRS, saveSessionSRS, markCard, SessionSRSCard } from '@/lib/session-srs';

function highlightWord(text: string, words: string[]) {
  for (const word of words) {
    if (!word || !text.includes(word)) continue;
    const parts = text.split(word);
    return (
      <>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && <span className="text-yellow-300 font-bold">{word}</span>}
          </span>
        ))}
      </>
    );
  }
  return <>{text}</>;
}

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Mode = 'flashcard' | 'quiz' | 'unknown' | 'viewall';

export default function SessionFlashCard() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
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
      if (e.code === 'Space') { e.preventDefault(); setFlipped(f => !f); }
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

  // === VIEW ALL ===
  if (mode === 'viewall') {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">📋 Tất cả từ vựng ({cards.length})</h1>
          <button onClick={() => setMode('flashcard')} className="text-sm text-gray-500">← Quay lại</button>
        </div>
        <div className="space-y-3">
          {cards.map((c, i) => {
            const isR = 'kanji' in c && c.kanji;
            return (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-800">{isR ? c.kanji : c.japanese}</span>
                      {isR && c.hiragana && <span className="text-sm text-sky-500">{c.hiragana}</span>}
                      {isR && c.romaji && <span className="text-xs text-gray-400 italic">{c.romaji}</span>}
                    </div>
                    <p className="text-sm text-emerald-600 font-medium">{c.meaning || c.vietnamese}</p>
                    {isR && c.antonym && (
                      <p className="text-xs text-gray-500 mt-1">↔ {c.antonym.kanji} ({c.antonym.hiragana}) – {c.antonym.meaning}</p>
                    )}
                  </div>
                  <button onClick={() => speak(isR ? c.kanji! : c.japanese)} className="text-lg">🔊</button>
                </div>
                {isR && c.examples && c.examples.length > 0 && (
                  <div className="mt-2 ml-10 space-y-1.5">
                    {c.examples.map((ex, j) => (
                      <div key={j} className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-sm font-medium text-gray-800" dangerouslySetInnerHTML={{ __html: c.kanji ? ex.japanese.replace(new RegExp(`(${escapeRegex(c.kanji)})`, 'g'), '<span class="text-amber-500 font-bold">$1</span>') : ex.japanese }} />
                        <p className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: c.hiragana ? ex.hiragana.replace(new RegExp(`(${escapeRegex(c.hiragana)})`, 'g'), '<span class="text-amber-500 font-bold">$1</span>') : ex.hiragana }} />
                        <p className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: (() => {
                          const meanings = (c.meaning || c.vietnamese || '').split(/[,、]/).map(s => s.trim()).filter(Boolean);
                          let html = ex.meaning_vi;
                          for (const m of meanings) {
                            html = html.replace(new RegExp(`(${escapeRegex(m)})`, 'gi'), '<span class="text-amber-500 font-bold">$1</span>');
                          }
                          return html;
                        })() }} />
                      </div>
                    ))}
                  </div>
                )}
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

  // === FLASHCARD (flip style like Kanji) ===
  const card = cards[index];
  const isRich = 'kanji' in card && card.kanji;

  return (
    <div className="h-[calc(100dvh-4rem)] p-3 flex flex-col items-center">
      <div className="flex items-center justify-between w-full max-w-md mb-1">
        <h1 className="text-xl font-bold text-gray-800">📖 Buổi {sessionId}</h1>
        <div className="flex gap-3 items-center">
          {unknown.size > 0 && <button onClick={() => setMode('unknown')} className="text-xs text-red-400">❌ {unknown.size}</button>}
          <button onClick={() => setMode('viewall')} className="text-xs text-gray-400 hover:text-indigo-500">📋 Tất cả</button>
          {isAdmin && <button onClick={() => setManaging(true)} className="text-xs text-gray-400 hover:text-red-500">🗑️</button>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-1">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Còn {remaining}/{cards.length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(done.size / cards.length) * 100}%`, background: '#22C55E' }} />
        </div>
      </div>

      {/* Card - full height */}
      <div className="w-full flex-1 cursor-pointer [perspective:1000px] my-2" onClick={() => setFlipped(!flipped)}>
        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
          {/* Front: Kanji + Hiragana */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl shadow-xl [backface-visibility:hidden] p-6" style={{ background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)' }}>
            <span className="font-bold text-white" style={{ fontSize: isRich ? '5rem' : '3.5rem' }}>{isRich ? card.kanji : card.japanese}</span>
            {isRich && card.hiragana && <p className="text-2xl mt-3 text-white/90">{card.hiragana}</p>}
            {isRich && card.romaji && <p className="text-sm mt-1 text-white/50 italic">{card.romaji}</p>}
            <button onClick={(e) => { e.stopPropagation(); speak(isRich ? card.kanji! : card.japanese); }} className="mt-4 text-2xl opacity-70 hover:opacity-100 text-white">🔊</button>
            <p className="mt-4 text-sm text-white/40">Tap hoặc Space để lật</p>
          </div>
          {/* Back: Nghĩa + Antonym + Ví dụ */}
          <div className="absolute inset-0 flex flex-col items-center rounded-2xl shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] p-5 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)' }}>
            <span className="text-4xl font-bold text-white">{isRich ? card.kanji : card.japanese}</span>
            {isRich && <p className="text-lg text-white/80 mt-1">{card.hiragana}</p>}
            <div className="mt-3 text-2xl font-medium text-amber-300">
              {card.meaning || card.vietnamese}
            </div>
            {isRich && card.antonym && (
              <div className="mt-3 text-sm bg-white/10 rounded-xl p-3 w-full">
                <span className="font-semibold text-white">Trái nghĩa:</span>{' '}
                <span className="font-medium text-white">{card.antonym.kanji}</span> <span className="text-white/70">({card.antonym.hiragana}) – {card.antonym.meaning}</span>
              </div>
            )}
            {isRich && card.examples && card.examples.length > 0 && (
              <div className="mt-3 w-full space-y-2">
                {card.examples.map((ex, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-3">
                    <div className="flex items-start justify-between">
                      <p className="font-bold text-base text-white">{highlightWord(ex.japanese, [card.kanji!, card.hiragana || ''])}</p>
                      <button onClick={(e) => { e.stopPropagation(); speak(ex.japanese); }} className="text-sm text-white/70 hover:text-white ml-2 shrink-0">🔊</button>
                    </div>
                    <p className="text-sm text-white mt-1" dangerouslySetInnerHTML={{ __html: card.hiragana ? ex.hiragana.replace(new RegExp(`(${escapeRegex(card.hiragana)})`, 'g'), '<span class="text-yellow-300 font-bold">$1</span>') : ex.hiragana }} />
                    <p className="text-sm text-white mt-1" dangerouslySetInnerHTML={{ __html: (() => {
                      const meanings = (card.meaning || card.vietnamese || '').split(/[,、]/).map(s => s.trim()).filter(Boolean);
                      let html = ex.meaning_vi;
                      for (const m of meanings) {
                        html = html.replace(new RegExp(`(${escapeRegex(m)})`, 'gi'), '<span class="text-yellow-300 font-bold">$1</span>');
                      }
                      return html;
                    })() }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 mt-2">
        <button onClick={() => { setFlipped(false); setIndex((index - 1 + cards.length) % cards.length); }} className="px-3 py-2 rounded-xl bg-gray-200 text-gray-600 text-sm font-medium">◀ Trước</button>
        <button onClick={() => next(false)} className="px-5 py-2 rounded-xl bg-red-500/80 text-white text-sm font-medium shadow">Chưa thuộc</button>
        <button onClick={() => next(true)} className="px-5 py-2 rounded-xl text-white text-sm font-medium shadow" style={{ background: '#22C55E' }}>Đã thuộc ✓</button>
        <button onClick={() => { setFlipped(false); setIndex((index + 1) % cards.length); }} className="px-3 py-2 rounded-xl bg-gray-200 text-gray-600 text-sm font-medium">Sau ▶</button>
      </div>

      <div className="mt-3 w-full max-w-sm">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(done.size / cards.length) * 100}%`, background: '#22C55E' }} />
        </div>
      </div>
    </div>
  );
}
