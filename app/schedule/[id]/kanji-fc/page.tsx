'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { speak } from '@/lib/speak';
import { sessionKanji, SessionKanjiEntry } from '@/data/session-kanji';
import { getSessionData, deleteSessionItem } from '@/lib/session-data';
import { supabase } from '@/lib/supabase';

function toHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

export default function SessionKanjiPage() {
  const { id } = useParams();
  const sessionId = parseInt(id as string);
  const baseCards = sessionKanji[sessionId] || [];
  const [cards, setCards] = useState<SessionKanjiEntry[]>(baseCards);

  useEffect(() => {
    // Load mnemonics from localStorage for base cards
    const key = `kanji_mnemonic_${sessionId}`;
    const raw = localStorage.getItem(key);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    const merged = baseCards.map(c => map[c.kanji] ? { ...c, mnemonic: map[c.kanji] } : c);

    getSessionData(sessionId, 'kanji').then(data => {
      const all = (data as SessionKanjiEntry[]).length ? [...merged, ...(data as SessionKanjiEntry[])] : merged;
      setCards(all);
    });
  }, [sessionId]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<'flashcard' | 'quiz'>('flashcard');

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<{ question: string; reading: string; correctKanji: string; options: string[] }[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [qSelected, setQSelected] = useState<number | null>(null);
  const [qScore, setQScore] = useState(0);

  // Spacebar + Arrow shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && e.code === 'ArrowLeft') { next(false); }
      if (flipped && e.code === 'ArrowRight') { next(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, index, done, unknown]);

  const reviewed = new Set([...done, ...unknown]);
  const remaining = cards.length - reviewed.size;

  function next(known: boolean) {
    const nd = new Set(done), nu = new Set(unknown);
    if (known) nd.add(index); else nu.add(index);
    setDone(nd); setUnknown(nu);
    setFlipped(false);
    setTimeout(() => {
      const all = new Set([...nd, ...nu]);
      if (all.size >= cards.length) return;
      let n = (index + 1) % cards.length;
      while (all.has(n)) n = (n + 1) % cards.length;
      setIndex(n);
    }, 300);
  }

  const [managing, setManaging] = useState(false);
  const [editingMnemonic, setEditingMnemonic] = useState(false);
  const [mnemonicText, setMnemonicText] = useState('');

  async function saveMnemonic() {
    const updated = [...cards];
    updated[index] = { ...updated[index], mnemonic: mnemonicText };
    setCards(updated);
    setEditingMnemonic(false);
    // Save to DB: update the uploaded items
    const baseLen = baseCards.length;
    if (index < baseLen) {
      // Hardcoded card — save mnemonic to localStorage fallback
      const key = `kanji_mnemonic_${sessionId}`;
      const raw = localStorage.getItem(key);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[cards[index].kanji] = mnemonicText;
      localStorage.setItem(key, JSON.stringify(map));
    } else {
      // DB card — update in supabase
      const dbItems = updated.slice(baseLen);
      await supabase.from('session_data').update({ items: dbItems, updated_at: new Date().toISOString() }).eq('session_num', sessionId).eq('type', 'kanji');
    }
  }

  async function handleDeleteKanji(idx: number) {
    if (!confirm(`Xóa "${cards[idx].kanji}"?`)) return;
    const baseLen = baseCards.length;
    if (idx >= baseLen) {
      await deleteSessionItem(sessionId, 'kanji', idx - baseLen);
    }
    setCards(cards.filter((_, i) => i !== idx));
  }

  if (!cards.length) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <p className="text-4xl mb-4">📭</p>
        <p className="text-lg font-bold text-gray-800">Buổi {sessionId} chưa có Kanji</p>
        <p className="text-sm text-gray-500 mt-2">Thêm dữ liệu Kanji để bắt đầu học</p>
        <a href={`/upload?session=${sessionId}`} className="mt-4 px-6 py-3 text-white rounded-xl font-medium shadow" style={{ background: '#6C63FF' }}>➕ Thêm Kanji</a>
      </div>
    );
  }

  // === MANAGE (delete) ===
  if (managing) {
    function exportKanji() {
      const json = JSON.stringify(cards, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kanji-buoi-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">🗑️ Quản lý Kanji ({cards.length})</h1>
          <button onClick={() => setManaging(false)} className="text-sm text-gray-500">← Quay lại</button>
        </div>
        <button onClick={exportKanji} className="mb-4 px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl text-sm font-medium shadow">📤 Export JSON</button>
        <button onClick={async () => { if (!confirm(`Xóa tất cả ${cards.length} kanji buổi ${sessionId}?`)) return; await supabase.from('session_data').delete().eq('session_num', sessionId).eq('type', 'kanji'); setCards([]); setManaging(false); }} className="mb-4 ml-2 px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl text-sm font-medium shadow">🗑️ Xóa tất cả</button>
        <a href={`/upload?session=${sessionId}`} className="mb-4 ml-2 inline-block px-4 py-2 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl text-sm font-medium shadow">➕ Thêm Kanji</a>
        <div className="space-y-2">
          {cards.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div>
                <span className="text-2xl font-bold">{c.kanji}</span>
                <span className="text-sm text-gray-500 ml-2">{c.hanViet} — {c.meaning}</span>
              </div>
              <button onClick={() => handleDeleteKanji(i)} className="text-xs px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">🗑️</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function startKanjiQuiz() {
    // Collect all vocab examples, shuffle, create questions
    const allVocab = cards.flatMap((c) => c.vocab.map((v) => ({ ...v, kanji: c.kanji })));
    const shuffled = [...allVocab].sort(() => Math.random() - 0.5);
    const questions = shuffled.map((v) => {
      const wrongKanji = cards.filter((c) => c.kanji !== v.kanji).sort(() => Math.random() - 0.5).slice(0, 3).map((c) => c.kanji);
      const opts = [v.kanji, ...wrongKanji].sort(() => Math.random() - 0.5);
      return { question: v.meaning, reading: v.reading, correctKanji: v.kanji, options: opts };
    });
    setQuizQuestions(questions);
    setQIdx(0); setQSelected(null); setQScore(0);
    setMode('quiz');
  }

  // === QUIZ MODE ===
  if (mode === 'quiz') {
    if (qIdx >= quizQuestions.length) {
      return (
        <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-xl font-bold text-gray-800">Kết quả trắc nghiệm Kanji</p>
          <p className="text-3xl font-bold text-indigo-600 mt-3">{qScore}/{quizQuestions.length}</p>
          <p className="text-sm text-gray-500 mt-1">{Math.round((qScore / quizQuestions.length) * 100)}% đúng</p>
          <div className="flex gap-3 mt-6">
            <button onClick={startKanjiQuiz} className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow">Làm lại</button>
            <button onClick={() => setMode('flashcard')} className="px-5 py-2 bg-gray-200 rounded-xl font-medium">Quay lại</button>
          </div>
        </div>
      );
    }
    const q = quizQuestions[qIdx];
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">✍️ Trắc nghiệm Kanji</h1>
        <p className="text-sm text-gray-500 mb-6">Câu {qIdx + 1}/{quizQuestions.length} • Đúng: {qScore}</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-6 w-full max-w-md">
          <p className="text-sm text-gray-400 mb-1">{q.reading}</p>
          <p className="text-lg font-bold text-gray-800">{q.question}</p>
        </div>
        <p className="text-sm text-gray-500 mb-4">Chọn Kanji đúng:</p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {q.options.map((opt, i) => {
            let cls = 'bg-white border-2 border-gray-200 hover:border-indigo-300';
            if (qSelected !== null) {
              if (opt === q.correctKanji) cls = 'bg-emerald-100 border-2 border-emerald-400';
              else if (i === qSelected) cls = 'bg-red-100 border-2 border-red-400';
            }
            return (
              <button key={i} disabled={qSelected !== null} onClick={() => {
                setQSelected(i);
                if (opt === q.correctKanji) setQScore((s) => s + 1);
                setTimeout(() => { setQSelected(null); setQIdx((idx) => idx + 1); }, 1200);
              }} className={`${cls} py-5 rounded-xl text-3xl font-bold transition-all shadow-sm`}>
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
        <p className="text-xl font-bold text-gray-800">Tổng kết Kanji Buổi {sessionId}</p>
        <p className="text-emerald-600 mt-2">✅ Thuộc: {done.size} | ❌ Chưa: {unknown.size}</p>
        <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
          <button onClick={startKanjiQuiz} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow">✍️ Trắc nghiệm từ ví dụ</button>
          <button onClick={() => { setDone(new Set()); setUnknown(new Set()); setIndex(0); setFlipped(false); }} className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium shadow">🔄 Học lại</button>
        </div>
        {unknown.size > 0 && (
          <div className="mt-6 w-full max-w-md text-left">
            <p className="font-bold text-red-500 mb-2">Cần ôn lại:</p>
            {[...unknown].map((i) => (
              <div key={i} className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100">
                <span className="text-2xl font-bold">{cards[i].kanji}</span>
                <span className="text-sm text-gray-500 ml-2">{cards[i].hanViet} — {cards[i].meaning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="h-[calc(100dvh-4rem)] p-3 flex flex-col items-center">
      <h1 className="text-xl font-bold text-gray-800 mb-1">🈁 Kanji Buổi {sessionId}</h1>
      {/* Progress bar */}
      <div className="w-full max-w-sm mb-1">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Còn {remaining}/{cards.length}</span>
          <div className="flex gap-3">
            <button onClick={() => { const shuffled = [...cards]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; } setCards(shuffled); setIndex(0); setFlipped(false); setDone(new Set()); setUnknown(new Set()); }} className="text-gray-400 hover:text-indigo-500">🔀 Trộn</button>
            <button onClick={() => setManaging(true)} className="text-gray-400 hover:text-red-500">🗑️ Quản lý</button>
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(done.size / cards.length) * 100}%`, background: '#6C63FF' }} />
        </div>
      </div>

      <div className="w-full flex-1 cursor-pointer [perspective:1000px] my-2" onClick={() => setFlipped(!flipped)}>
        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
          {/* Front: Kanji only - no readings */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl shadow-xl [backface-visibility:hidden] p-6" style={{ background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)' }}>
            <span className="font-bold text-white" style={{ fontSize: '7rem' }}>{card.kanji}</span>
            <button onClick={(e) => { e.stopPropagation(); speak(card.vocab[0]?.word || card.kanji); }} className="mt-4 text-2xl opacity-70 hover:opacity-100 text-white">🔊</button>
            <p className="mt-4 text-sm text-white/40">Tap hoặc Space để lật</p>
          </div>
          {/* Back: compact layout - no scroll */}
          <div className="absolute inset-0 flex flex-col items-center rounded-2xl shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] p-4 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)' }}>
            <span className="text-5xl font-bold text-white">{card.kanji}</span>
            <span className="text-lg mt-0.5 font-semibold"><span className="text-white">{card.hanViet}</span> <span className="text-amber-300">— {card.meaning}</span></span>
            <div className="text-center text-white/80 text-sm">
              {card.onyomi && <span className="mr-2">音: {toHiragana(card.onyomi)}</span>}
              {card.kunyomi && <span>訓: {card.kunyomi}</span>}
            </div>
            {card.mnemonic && (
              <div className="mt-2 rounded-lg p-2.5 w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-sm text-white" dangerouslySetInnerHTML={{ __html: '💡 ' + card.mnemonic.replace(/\*\*(.*?)\*\*/g, '<span class="text-amber-300 font-bold">$1</span>') }} />
              </div>
            )}
            {!editingMnemonic && (
              <button onClick={(e) => { e.stopPropagation(); setMnemonicText(card.mnemonic || ''); setEditingMnemonic(true); }} className="cursor-pointer text-[11px] text-white/40 hover:text-white">
                {card.mnemonic ? '✏️ Sửa' : '+ Gợi nhớ'}
              </button>
            )}
            {editingMnemonic && (
              <div className="mt-1 w-full" onClick={(e) => e.stopPropagation()}>
                <input type="text" value={mnemonicText} onChange={(e) => setMnemonicText(e.target.value)} placeholder="VD: Tay (扌) cầm vũ khí (殳) **ném**" className="w-full text-xs px-2 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none" />
                <div className="flex gap-2 mt-1">
                  <button onClick={saveMnemonic} className="text-[11px] px-2 py-0.5 bg-emerald-400 text-white rounded">💾</button>
                  <button onClick={() => setEditingMnemonic(false)} className="text-[11px] px-2 py-0.5 bg-white/20 text-white rounded">✕</button>
                </div>
              </div>
            )}
            {/* Vocab */}
            <div className="mt-2 w-full space-y-1.5 flex-1">
              {card.vocab.map((v, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-bold text-white/70 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      {v.reading && <div className="text-[10px] leading-none mb-0.5" style={{ color: 'white' }} dangerouslySetInnerHTML={{ __html: v.highlightReading ? v.reading.replace(new RegExp(`(${v.highlightReading})`, 'g'), '<span style="color:#fbbf24">$1</span>') : v.reading }} />}
                      <div className="text-[15px] font-bold text-white" dangerouslySetInnerHTML={{ __html: v.word.replace(new RegExp(`(${v.highlight || card.kanji})`, 'g'), '<span class="text-amber-300">$1</span>') }} />
                      <div className="text-xs text-white/60" dangerouslySetInnerHTML={{ __html: v.highlightMeaning ? v.meaning.replace(new RegExp(`(${v.highlightMeaning})`, 'gi'), '<span class="text-amber-300">$1</span>') : v.meaning }} />
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        {flipped ? (
          <>
            <button onClick={() => next(false)} className="px-6 py-3 rounded-xl bg-red-500/80 text-white font-medium shadow">← Chưa thuộc</button>
            <button onClick={() => next(true)} className="px-6 py-3 rounded-xl text-white font-medium shadow" style={{ background: '#22C55E' }}>Đã thuộc ✓ →</button>
          </>
        ) : (
          <button onClick={() => setFlipped(true)} className="px-8 py-3 rounded-xl text-white font-medium shadow" style={{ background: '#6C63FF' }}>Lật thẻ <span className="text-xs opacity-60 ml-1">[Space]</span></button>
        )}
      </div>

      <div className="mt-4 w-full max-w-sm">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(done.size / cards.length) * 100}%`, background: '#22C55E' }} />
        </div>
      </div>
    </div>
  );
}
