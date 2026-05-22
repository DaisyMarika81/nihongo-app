'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { speak } from '@/lib/speak';
import { sessionKanji, SessionKanjiEntry } from '@/data/session-kanji';

function toHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

export default function SessionKanjiPage() {
  const { id } = useParams();
  const sessionId = parseInt(id as string);
  const [cards, setCards] = useState<SessionKanjiEntry[]>(sessionKanji[sessionId] || []);
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

  // Load custom uploaded kanji
  useEffect(() => {
    const custom = localStorage.getItem(`nihongo_custom_kanji_${sessionId}`);
    if (custom) {
      const data = JSON.parse(custom);
      if (data.cards) setCards([...(sessionKanji[sessionId] || []), ...data.cards]);
    }
  }, [sessionId]);

  // Spacebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

  if (!cards.length) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <p className="text-4xl mb-4">📭</p>
        <p className="text-lg font-bold text-gray-800">Buổi {sessionId} chưa có Kanji</p>
        <p className="text-sm text-gray-500 mt-2">Upload JSON ở trang Upload</p>
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
    <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
      <h1 className="text-xl font-bold text-gray-800 mb-2">🈁 Kanji Buổi {sessionId}</h1>
      <p className="text-sm text-gray-500 mb-4">Còn {remaining}/{cards.length}</p>

      <div className="w-full max-w-md min-h-[320px] cursor-pointer [perspective:1000px] mb-4" onClick={() => setFlipped(!flipped)}>
        <div className={`relative w-full min-h-[320px] transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
          {/* Front: Kanji only */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-xl [backface-visibility:hidden] p-6">
            <span className="text-8xl font-bold" style={{ color: '#fff' }}>{card.kanji}</span>
            <div className="mt-4 text-center" style={{ color: '#fff' }}>
              {card.onyomi && <div className="text-lg opacity-90">音: <span className="text-yellow-200">{toHiragana(card.onyomi)}</span></div>}
              {card.kunyomi && <div className="text-lg opacity-90">訓: <span className="text-yellow-200">{card.kunyomi}</span></div>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); speak(card.vocab[0]?.word || card.kanji); }} className="mt-3 text-xl opacity-80 hover:opacity-100" style={{ color: '#fff' }}>🔊</button>
          </div>
          {/* Back: HanViet + Meaning + Vocab */}
          <div className="absolute inset-0 flex flex-col items-center justify-start rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 overflow-y-auto">
            <span className="text-4xl font-bold" style={{ color: '#fff' }}>{card.kanji}</span>
            <span className="text-xl mt-1" style={{ color: '#fff' }}>{card.hanViet} — {card.meaning}</span>
            <div className="mt-4 w-full space-y-3">
              {card.vocab.map((v, i) => (
                <div key={i} className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-left border border-white/30">
                  <div className="text-base font-bold" style={{ color: '#fff' }}>
                    <ruby>{v.word}<rp>(</rp><rt className="text-xs font-normal" style={{ color: '#fef08a' }}>{v.reading}</rt><rp>)</rp></ruby>
                  </div>
                  <div className="text-sm mt-1" style={{ color: '#fff', opacity: 0.9 }}>{v.meaning}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-4">{flipped ? '' : 'Space = lật'}</p>

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
