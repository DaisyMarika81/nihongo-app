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
type QuizMode = 'exam' | 'study' | 'hard';
type FillBlankQ = { sentence: string; blanked: string; correct: string; card: SessionCard; hint?: string; exampleMeaning?: string };

function getWord(c: SessionCard) { return c.kanji || c.japanese; }

function findAndBlank(sentence: string, target: string): { found: boolean; blanked: string; removed: string } {
  const idx = sentence.indexOf(target);
  if (idx !== -1) {
    return { found: true, blanked: sentence.slice(0, idx) + '____' + sentence.slice(idx + target.length), removed: target };
  }
  // Try partial: target might conjugate (e.g. 通う → 通って)
  const base = target.replace(/[うくぐすつぬぶむる]$/, '');
  if (base.length >= 1 && sentence.includes(base)) {
    const i = sentence.indexOf(base);
    let end = i + base.length;
    while (end < sentence.length && /[\u3040-\u309F\u30A0-\u30F6]/.test(sentence[end])) end++;
    const removed = sentence.slice(i, end);
    return { found: true, blanked: sentence.slice(0, i) + '____' + sentence.slice(end), removed };
  }
  return { found: false, blanked: sentence, removed: '' };
}

function generateFillBlank(cards: SessionCard[]): FillBlankQ[] {
  const result: FillBlankQ[] = [];
  for (const c of cards) {
    if (!c.examples || c.examples.length === 0) continue;
    const word = getWord(c);
    const shuffledEx = shuffle(c.examples);
    for (const ex of shuffledEx) {
      const fb = findAndBlank(ex.japanese, word);
      if (fb.found) {
        result.push({ sentence: ex.japanese, blanked: fb.blanked, correct: fb.removed, card: c, hint: c.hiragana, exampleMeaning: ex.meaning_vi });
        break;
      }
    }
  }
  return shuffle(result);
}

export default function VocabQuizPage() {
  const [quizMode, setQuizMode] = useState<QuizMode>('study');
  const [phase, setPhase] = useState<Phase>('config');
  const [allCards, setAllCards] = useState<Map<number, SessionCard[]>>(new Map());
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());
  const [questionCount, setQuestionCount] = useState(20);
  const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState<SessionCard[]>([]);
  const [pool, setPool] = useState<SessionCard[]>([]);
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCards, setWrongCards] = useState<SessionCard[]>([]);
  const [showExample, setShowExample] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false); // study mode: toggle meaning
  const [fbQuestions, setFbQuestions] = useState<FillBlankQ[]>([]);
  const [showHint, setShowHint] = useState(false);

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

  function getReading(c: SessionCard) { return c.hiragana || c.japanese; }

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
    setShowHint(false);
    setShowMeaning(false);
    if (quizMode === 'exam' || quizMode === 'study') {
      const fbs = generateFillBlank(qs);
      if (fbs.length === 0) return;
      setFbQuestions(fbs);
      generateFbOptions(fbs, allPool, 0);
    } else {
      generateHardOptions(qs, allPool, 0);
    }
    setPhase('quiz');
  }

  function retryWrong() {
    if (wrongCards.length < 4) {
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
      setShowHint(false);
      setShowMeaning(false);
      if (quizMode === 'exam' || quizMode === 'study') {
        const fbs = generateFillBlank(qs);
        setFbQuestions(fbs);
        generateFbOptions(fbs, cards, 0);
      } else {
        generateHardOptions(qs, cards, 0);
      }
      setPhase('quiz');
    } else {
      startQuiz(wrongCards);
    }
  }

  function generateHardOptions(qs: SessionCard[], allPool: SessionCard[], idx: number) {
    const correct = getReading(qs[idx]);
    const wrong = shuffle(allPool.filter(c => getReading(c) !== correct)).slice(0, 3).map(c => getReading(c));
    setOptions(shuffle([correct, ...wrong]));
  }

  function generateFbOptions(fbs: FillBlankQ[], allPool: SessionCard[], idx: number) {
    const correct = fbs[idx].correct;
    const wrong = shuffle(allPool.filter(c => getWord(c) !== correct && getMeaning(c) !== correct)).slice(0, 3).map(c => getWord(c));
    setOptions(shuffle([correct, ...wrong]));
  }

  function handleAnswer(i: number) {
    if (selected !== null) return;
    setSelected(i);
    const isFillBlank = quizMode === 'exam' || quizMode === 'study';
    const correctAnswer = isFillBlank ? fbQuestions[index].correct : getReading(questions[index]);
    const isCorrect = options[i] === correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
      if (isFillBlank && quizMode === 'exam') {
        setShowExample(true); return; // exam: always show explanation
      }
      if (isFillBlank && quizMode === 'study') {
        setShowExample(true); return; // study: show explanation + meaning
      }
      // hard mode: show example if available
      const q = questions[index];
      if (q.examples && q.examples.length > 0) {
        setShowExample(true); return;
      }
    } else {
      setWrongCards(prev => [...prev, questions[index]]);
    }
    setTimeout(() => goNext(), 1200);
  }

  function goNext() {
    setSelected(null);
    setShowExample(false);
    setShowHint(false);
    setShowMeaning(false);
    const isFillBlank = quizMode === 'exam' || quizMode === 'study';
    const total = isFillBlank ? fbQuestions.length : questions.length;
    if (index + 1 >= total) {
      setPhase('result');
    } else {
      const next = index + 1;
      setIndex(next);
      if (isFillBlank) {
        generateFbOptions(fbQuestions, pool, next);
      } else {
        generateHardOptions(questions, pool, next);
      }
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
            {/* 📚 Chọn buổi */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">📚 <span>Chọn buổi</span></span>
                <button onClick={() => setSelectedSessions(selectedSessions.size === allCards.size ? new Set() : new Set(allCards.keys()))}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 transition-all">
                  {selectedSessions.size === allCards.size ? '🗑 Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[...allCards.keys()].sort((a, b) => a - b).map(s => (
                  <button key={s} onClick={() => toggleSession(s)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      selectedSessions.has(s) ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    style={selectedSessions.has(s) ? { background: '#6C63FF' } : {}}>
                    Buổi {s} <span className="opacity-70">({allCards.get(s)?.length})</span>
                  </button>
                ))}
              </div>
              {selectedSessions.size > 0 && (
                <p className="text-xs text-gray-400 mt-2">Đã chọn {selectedSessions.size} buổi — Tổng: <strong>{totalCards}</strong> từ</p>
              )}
            </div>

            <hr className="border-gray-100 mb-6" />

            {/* 🎯 Chọn dạng */}
            <div className="mb-6">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mb-3">🎯 <span>Chọn dạng</span></span>
              <div className="flex flex-col gap-1.5">
                {[
                  { key: 'study' as QuizMode, label: '📖 Học', desc: 'Đục lỗ + nghĩa hỗ trợ' },
                  { key: 'exam' as QuizMode, label: '📝 Luyện thi', desc: 'Đục lỗ, không nghĩa' },
                  { key: 'hard' as QuizMode, label: '🔥 Khó', desc: 'Chỉ từ, nhớ cách đọc' },
                ].map(m => (
                  <button key={m.key} onClick={() => setQuizMode(m.key)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition-all ${
                      quizMode === m.key ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={quizMode === m.key ? { background: '#6C63FF' } : {}}>
                    <span className="text-base">{quizMode === m.key ? '✓ ' : ''}{m.label}</span>
                    <span className={`text-xs ${quizMode === m.key ? 'text-white/70' : 'text-gray-400'}`}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-100 mb-6" />

            {/* 🔢 Số câu hỏi */}
            <div className="mb-6">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mb-3">🔢 <span>Số câu hỏi</span></span>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={totalCards} value={questionCount}
                  onChange={e => setQuestionCount(Math.max(1, Math.min(totalCards, Number(e.target.value) || 1)))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-center" />
                <span className="text-xs text-gray-400">/ {totalCards} câu</span>
                <button onClick={() => setQuestionCount(totalCards)} className="text-xs px-3 py-1.5 rounded-xl font-medium text-white shadow-sm" style={{ background: '#6C63FF' }}>Tất cả</button>
              </div>
            </div>

            <button onClick={() => startQuiz()} disabled={totalCards < 4}
              className="w-full py-4 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}>
              <span className="text-base">🚀 Bắt đầu</span>
              <span className="block text-xs font-normal mt-0.5 opacity-80">{Math.min(questionCount, totalCards)} câu • {totalCards} từ • {{ study: 'Học', exam: 'Luyện thi', hard: 'Khó' }[quizMode]}</span>
            </button>
          </>
        )}
      </div>
    );
  }

  // === RESULT ===
  if (phase === 'result') {
    const isFillBlank = quizMode === 'exam' || quizMode === 'study';
    const total = isFillBlank ? fbQuestions.length : questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="min-h-screen p-4 pb-24 max-w-md mx-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-xl font-bold text-gray-800">Kết quả</p>
          <p className="text-3xl font-bold text-indigo-600 mt-3">{score}/{total}</p>
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
  const isFillBlank = quizMode === 'exam' || quizMode === 'study';
  const totalQ = isFillBlank ? fbQuestions.length : questions.length;
  const fbq = isFillBlank ? fbQuestions[index] : null;
  const q = isFillBlank ? fbq!.card : questions[index];
  const word = q.kanji || q.japanese;
  const correctAnswer = isFillBlank ? fbq!.correct : getReading(q);

  function highlightWordInSentence(sentence: string, w: string): string {
    const i = sentence.indexOf(w);
    if (i === -1) return sentence;
    return sentence.slice(0, i) + '【' + w + '】' + sentence.slice(i + w.length);
  }

  return (
    <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
      <div className="w-full max-w-md mb-4">
        <h1 className="text-lg font-bold text-gray-800">
          {{ exam: '📝 Luyện thi', study: '📖 Học', hard: '🔥 Khó' }[quizMode]}
        </h1>
        <p className="text-xs text-gray-600 font-medium mt-0.5">
          {{ exam: 'Chọn từ điền vào chỗ trống', study: 'Chọn từ điền vào chỗ trống', hard: 'Chọn cách đọc đúng' }[quizMode]}
        </p>
      </div>

      {isFillBlank ? (
        <>
          {/* Fill-blank sentence card */}
          <div className="rounded-2xl p-6 shadow-lg mb-6 w-full max-w-md text-center" style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
            <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed" style={{ wordBreak: 'break-word' }}>
              {fbq!.blanked.split('____').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="inline-block mx-1 px-4 pb-1 border-b-2 border-dashed border-white/70" style={{ minWidth: '80px' }}>___</span>}
                </span>
              ))}
            </p>
            <button onClick={() => speak(fbq!.sentence)}
              className="mt-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto hover:bg-white/30 transition-all">
              <span className="text-lg">🔊</span>
            </button>
          </div>
          {/* Study mode: show meaning button; Exam mode: no meaning */}
          {quizMode === 'study' && fbq!.hint && (
            <div className="flex items-center justify-center mb-4 -mt-4">
              <button onClick={() => setShowHint(!showHint)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${showHint ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                {showHint ? <>💡 {fbq!.hint}</> : <>💡 Xem nghĩa</>}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Hard mode: show word only */}
          <div className="rounded-2xl p-8 shadow-lg text-center mb-6 w-full max-w-md" style={{ background: 'linear-gradient(135deg, #DC2626, #F97316)' }}>
            <p className="text-5xl font-bold text-white">{word}</p>
            <button onClick={() => speak(word)}
              className="mt-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto hover:bg-white/30 transition-all">
              <span className="text-lg">🔊</span>
            </button>
          </div>
        </>
      )}

      {/* 4 options */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        {options.map((opt, i) => {
          let cls = 'bg-white border-2 border-gray-200 hover:border-[#6C63FF]/40 scale-100';
          if (selected !== null) {
            if (opt === correctAnswer) cls = 'bg-emerald-100 border-emerald-500 border-[3px] text-emerald-800 font-bold scale-[1.02]';
            else if (i === selected) cls = 'bg-red-100 border-red-500 border-[3px] text-red-700 shake';
          }
          return (
            <button key={i} disabled={selected !== null} onClick={() => handleAnswer(i)}
              className={`${cls} py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm text-left`}>
              {selected !== null && opt === correctAnswer ? <span className="mr-1.5 text-emerald-600">✓</span> : null}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation after correct answer */}
      {showExample && (
        <div className="mt-4 mb-6 w-full max-w-md bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">✅ <span>Chính xác</span></p>
          {isFillBlank ? (
            <>
              <p className="font-bold text-gray-800 text-lg" style={{ wordBreak: 'break-word' }}>{highlightWordInSentence(fbq!.sentence, fbq!.correct)}</p>
            </>
          ) : q.examples && q.examples.length > 0 ? (
            <p className="font-bold text-gray-800 text-lg" style={{ wordBreak: 'break-word' }}>{highlightWordInSentence(q.examples[0].japanese, word)}</p>
          ) : null}
          <div className="mt-3 space-y-1">
            <p className="text-base font-bold text-gray-800">{word}<span className="text-sm font-normal text-gray-500 ml-2">（{getReading(q)}）</span></p>
            <p className="text-sm text-emerald-700 font-medium">→ {isFillBlank ? fbq?.exampleMeaning || getMeaning(q) : q.examples?.[0]?.meaning_vi || getMeaning(q)}</p>
          </div>
          <button onClick={goNext} className="mt-4 mx-auto block w-fit min-w-[140px] py-2 px-6 text-white rounded-lg text-sm font-medium shadow" style={{ background: '#6C63FF' }}>
            Tiếp →
          </button>
        </div>
      )}

      {/* Progress bar at bottom */}
      <div className="mt-auto w-full max-w-md pt-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((index + 1) / totalQ) * 100}%`, background: '#6C63FF' }} />
          </div>
          <span className="text-xs font-medium text-gray-500 shrink-0">{index + 1}/{totalQ}</span>
        </div>
        <p className="text-xs text-emerald-600 font-medium mt-1">✓ {score} đúng</p>
      </div>
    </div>
  );
}
