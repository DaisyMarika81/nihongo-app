'use client';

import { useState, useEffect } from 'react';
import { sessionCards, SessionCard } from '@/data/session-cards';
import { getSessionData } from '@/lib/session-data';
import { speak } from '@/lib/speak';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'config' | 'quiz' | 'result';

export default function VocabQuizPage() {
  const [phase, setPhase] = useState<Phase>('config');
  const [allCards, setAllCards] = useState<Map<number, SessionCard[]>>(new Map());
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());
  const [questionCount, setQuestionCount] = useState(20);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [questions, setQuestions] = useState<SessionCard[]>([]);
  const [pool, setPool] = useState<SessionCard[]>([]);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCards, setWrongCards] = useState<SessionCard[]>([]);
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    async function load() {
      const map = new Map<number, SessionCard[]>();
      for (let i = 1; i <= 45; i++) {
        const base = sessionCards[i] || [];
        const cloud = (await getSessionData(i, 'flashcard')) as SessionCard[];
        const merged = [...base, ...cloud];
        if (merged.length > 0) map.set(i, merged);
      }
      setAllCards(map);
      setSelectedSessions(new Set(map.keys()));
      setLoading(false);
    }
    load();
  }, []);

  function getMeaning(c: SessionCard) { return c.meaning || c.vietnamese; }

  function startQuiz(customCards?: SessionCard[]) {
    const cards: SessionCard[] = customCards || [];
    if (!customCards) {
      selectedSessions.forEach(s => {
        const c = allCards.get(s);
        if (c) cards.push(...c);
      });
    }
    if (cards.length < 4) return;
    const allPool = customCards || cards;
    const shuffled = shuffle(cards);
    const qs = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    setQuestions(qs);
    setPool(allPool.length >= 4 ? allPool : cards);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setWrongCards([]);
    setShowExample(false);
    generateOptions(qs, allPool.length >= 4 ? allPool : cards, 0);
    setPhase('quiz');
  }

  function retryWrong() {
    if (wrongCards.length < 4) {
      // Not enough wrong cards for unique options, use full pool
      const cards: SessionCard[] = [];
      selectedSessions.forEach(s => { const c = allCards.get(s); if (c) cards.push(...c); });
      setPool(cards);
      const qs = shuffle(wrongCards);
      setQuestions(qs);
      setIndex(0);
      setScore(0);
      setSelected(null);
      setWrongCards([]);
      setShowExample(false);
      generateOptions(qs, cards, 0);
      setPhase('quiz');
    } else {
      startQuiz(wrongCards);
    }
  }

  function generateOptions(qs: SessionCard[], allPool: SessionCard[], idx: number) {
    const correct = getMeaning(qs[idx]);
    const wrong = shuffle(allPool.filter(c => getMeaning(c) !== correct)).slice(0, 3).map(c => getMeaning(c));
    setOptions(shuffle([correct, ...wrong]));
  }

  function handleAnswer(i: number) {
    if (selected !== null) return;
    setSelected(i);
    const q = questions[index];
    const isCorrect = options[i] === getMeaning(q);
    if (isCorrect) {
      setScore(s => s + 1);
      // Show example if available
      if (q.examples && q.examples.length > 0) {
        setShowExample(true);
        return; // Wait for user to tap "Tiếp"
      }
    } else {
      setWrongCards(prev => [...prev, q]);
    }
    setTimeout(() => goNext(), 1200);
  }

  function goNext() {
    setSelected(null);
    setShowExample(false);
    if (index + 1 >= questions.length) {
      setPhase('result');
    } else {
      const next = index + 1;
      setIndex(next);
      generateOptions(questions, pool, next);
    }
  }

  function toggleSession(s: number) {
    const next = new Set(selectedSessions);
    next.has(s) ? next.delete(s) : next.add(s);
    setSelectedSessions(next);
  }

  // === CONFIG ===
  if (phase === 'config') {
    const totalCards = [...selectedSessions].reduce((sum, s) => sum + (allCards.get(s)?.length || 0), 0);
    return (
      <div className="min-h-screen p-4 pb-24 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">✍️ Trắc nghiệm từ vựng</h1>
        <p className="text-sm text-gray-500 mb-6">Chọn buổi và số câu hỏi</p>

        {loading ? (
          <p className="text-center text-gray-400">Đang tải...</p>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Chọn buổi ({selectedSessions.size}/{allCards.size})</span>
                <button onClick={() => setSelectedSessions(selectedSessions.size === allCards.size ? new Set() : new Set(allCards.keys()))}
                  className="text-xs text-indigo-500 font-medium">
                  {selectedSessions.size === allCards.size ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[...allCards.keys()].sort((a, b) => a - b).map(s => (
                  <button key={s} onClick={() => toggleSession(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedSessions.has(s) ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                    Buổi {s} <span className="opacity-70">({allCards.get(s)?.length})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700">Số câu hỏi:</label>
              <div className="flex items-center gap-2 mt-2">
                <input type="number" min={1} max={totalCards} value={questionCount}
                  onChange={e => setQuestionCount(Math.max(1, Math.min(totalCards, Number(e.target.value) || 1)))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-center" />
                <span className="text-xs text-gray-400">/ {totalCards} từ</span>
                <button onClick={() => setQuestionCount(totalCards)} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded-lg font-medium">Tất cả</button>
              </div>
            </div>

            <button onClick={() => startQuiz()} disabled={totalCards < 4}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow disabled:opacity-50">
              🚀 Bắt đầu ({Math.min(questionCount, totalCards)} câu)
            </button>
          </>
        )}
      </div>
    );
  }

  // === RESULT ===
  if (phase === 'result') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen p-4 pb-24 max-w-md mx-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-xl font-bold text-gray-800">Kết quả</p>
          <p className="text-3xl font-bold text-indigo-600 mt-3">{score}/{questions.length}</p>
          <p className="text-sm text-gray-500 mt-1">{pct}% đúng</p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => startQuiz()} className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow">Làm lại</button>
            {wrongCards.length > 0 && (
              <button onClick={retryWrong} className="px-5 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl font-medium shadow">
                🔄 Làm lại câu sai ({wrongCards.length})
              </button>
            )}
            <button onClick={() => setPhase('config')} className="px-5 py-2 bg-gray-200 rounded-xl font-medium">Cài đặt</button>
          </div>
        </div>

        {/* Wrong cards list */}
        {wrongCards.length > 0 && (
          <div>
            <h2 className="font-semibold text-red-500 mb-3">❌ Câu sai ({wrongCards.length})</h2>
            <div className="space-y-2">
              {wrongCards.map((c, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-red-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-800">{c.kanji || c.japanese}</span>
                    {c.hiragana && <span className="text-sm text-gray-400 ml-1">({c.hiragana})</span>}
                    <span className="text-sm text-gray-500 ml-2">— {getMeaning(c)}</span>
                  </div>
                  <button onClick={() => speak(c.kanji || c.japanese)} className="text-sm opacity-60 hover:opacity-100">🔊</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // === QUIZ ===
  const q = questions[index];
  const correctAnswer = getMeaning(q);

  return (
    <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
      <h1 className="text-xl font-bold text-gray-800 mb-2">✍️ Trắc nghiệm từ vựng</h1>
      <p className="text-sm text-gray-500 mb-6">Câu {index + 1}/{questions.length} • Đúng: {score}</p>

      {/* Question card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-6 w-full max-w-md">
        <p className="text-3xl font-bold text-gray-800">{q.kanji || q.japanese}</p>
        {q.hiragana && <p className="text-sm text-gray-400 mt-1">{q.hiragana}</p>}
        {q.romaji && <p className="text-xs text-gray-400 italic">{q.romaji}</p>}
        <button onClick={() => speak(q.kanji || q.japanese)} className="mt-2 text-lg opacity-60 hover:opacity-100">🔊</button>
        <p className="text-sm text-gray-400 mt-3">Chọn nghĩa đúng:</p>
      </div>

      {/* 4 options */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {options.map((opt, i) => {
          let cls = 'bg-white border-2 border-gray-200 hover:border-indigo-300';
          if (selected !== null) {
            if (opt === correctAnswer) cls = 'bg-emerald-100 border-2 border-emerald-400';
            else if (i === selected) cls = 'bg-red-100 border-2 border-red-400';
          }
          return (
            <button key={i} disabled={selected !== null} onClick={() => handleAnswer(i)}
              className={`${cls} py-4 px-3 rounded-xl font-medium text-sm transition-all shadow-sm text-left`}>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Show example on correct */}
      {showExample && q.examples && (
        <div className="mt-4 w-full max-w-sm bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-bold text-emerald-700 mb-2">📝 Ví dụ:</p>
          {q.examples.slice(0, 1).map((ex, i) => (
            <div key={i}>
              <p className="font-bold text-[#1a202c] text-lg">{ex.japanese}</p>
              {ex.hiragana && <p className="text-sm text-[#2d3748]">{ex.hiragana}</p>}
              {ex.romaji && <p className="text-xs text-[#718096] italic">{ex.romaji}</p>}
              {ex.meaning_vi && <p className="text-sm text-[#2d3748] mt-1 font-medium">{ex.meaning_vi}</p>}
            </div>
          ))}
          <button onClick={goNext} className="mt-3 w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium">
            Tiếp →
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-6 w-full max-w-sm">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
