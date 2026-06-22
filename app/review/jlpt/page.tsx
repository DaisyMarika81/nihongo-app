'use client';

import { useState, useEffect } from 'react';
import { sessionKanji, SessionKanjiEntry } from '@/data/session-kanji';
import { getSessionData, getAllSessionData } from '@/lib/session-data';
import { speak } from '@/lib/speak';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type QuizMode = 'study' | 'exam' | 'hard';
type Question = {
  type: 'reading-to-kanji' | 'kanji-to-reading';
  sentence: string;
  highlight: string;
  highlightMeaning?: string;
  vocabHighlight?: string;
  highlightReading?: string;
  correctAnswer: string;
  options: string[];
  card: SessionKanjiEntry & { word: string; reading: string };
};

function generateJLPTQuestions(kanjiData: SessionKanjiEntry[], mode: QuizMode, count = 35): Question[] {
  const questions: Question[] = [];
  const allVocab = kanjiData.flatMap((k) => k.vocab.map((v) => ({ ...v, kanji: k.kanji, hanViet: k.hanViet })));

  for (let i = 0; i < count && allVocab.length > 0; i++) {
    const vocab = allVocab[i % allVocab.length];
    const card = vocab as SessionKanjiEntry & { word: string; reading: string };

    if (mode === 'hard') {
      const wrongReadings = shuffle(allVocab.filter((v) => v.reading !== vocab.reading)).slice(0, 3).map((v) => v.reading);
      questions.push({
        type: 'kanji-to-reading', sentence: vocab.meaning, highlight: vocab.word,
        vocabHighlight: vocab.highlight || vocab.kanji, correctAnswer: vocab.reading,
        options: shuffle([vocab.reading, ...wrongReadings.slice(0, 3)]).slice(0, 4), card,
      });
    } else {
      const isType2 = Math.random() < 0.5;
      if (isType2) {
        const wrongOptions = shuffle(kanjiData.filter((k) => k.kanji !== vocab.kanji)).slice(0, 3)
          .map((k) => vocab.word.replace(new RegExp(`[${vocab.kanji}]`, 'g'), k.kanji) || k.kanji + vocab.word.slice(1));
        questions.push({
          type: 'reading-to-kanji', sentence: vocab.meaning, highlight: vocab.reading,
          highlightMeaning: vocab.highlightMeaning, highlightReading: vocab.highlightReading,
          vocabHighlight: vocab.highlight || vocab.kanji, correctAnswer: vocab.word,
          options: shuffle([vocab.word, ...wrongOptions.slice(0, 3)]).slice(0, 4), card,
        });
      } else {
        const wrongReadings = shuffle(allVocab.filter((v) => v.reading !== vocab.reading)).slice(0, 3).map((v) => v.reading);
        questions.push({
          type: 'kanji-to-reading', sentence: vocab.meaning, highlight: vocab.word,
          highlightMeaning: vocab.highlightMeaning, vocabHighlight: vocab.highlight || vocab.kanji,
          correctAnswer: vocab.reading,
          options: shuffle([vocab.reading, ...wrongReadings.slice(0, 3)]).slice(0, 4), card,
        });
      }
    }
  }
  return shuffle(questions);
}

export default function JLPTQuizPage() {
  const [quizMode, setQuizMode] = useState<QuizMode>('study');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCards, setWrongCards] = useState<Question[]>([]);
  const [started, setStarted] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [questionCount, setQuestionCount] = useState(20);
  const [mounted, setMounted] = useState(false);
  const [allSessions, setAllSessions] = useState<Map<number, number>>(new Map());
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());
  const [allKanjiCache, setAllKanjiCache] = useState<Map<number, SessionKanjiEntry[]>>(new Map());

  useEffect(() => { setMounted(true); loadSessions(); }, []);

  async function loadSessions() {
    const dbSessions = await getAllSessionData();
    const kanjiSessions = dbSessions.filter((s) => s.type === 'kanji');
    const map = new Map<number, number>();
    Object.entries(sessionKanji).forEach(([k, v]) => map.set(Number(k), v.length));
    kanjiSessions.forEach((s) => map.set(s.session_num, (map.get(s.session_num) || 0) + s.count));
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).filter((k) => k.startsWith('nihongo_custom_kanji_')).forEach((key) => {
        const num = parseInt(key.replace('nihongo_custom_kanji_', ''));
        try { const data = JSON.parse(localStorage.getItem(key) || ''); if (data.cards) map.set(num, (map.get(num) || 0) + data.cards.length); } catch {}
      });
    }
    setAllSessions(map);
    setSelectedSessions(new Set(map.keys()));
  }

  async function loadKanjiForSessions(sessions: number[]): Promise<SessionKanjiEntry[]> {
    const all: SessionKanjiEntry[] = [];
    for (const s of sessions) {
      if (allKanjiCache.has(s)) { all.push(...allKanjiCache.get(s)!); continue; }
      const base = sessionKanji[s] || [];
      const dbData = await getSessionData(s, 'kanji') as SessionKanjiEntry[];
      let custom: SessionKanjiEntry[] = [];
      if (typeof window !== 'undefined') {
        try { const raw = localStorage.getItem(`nihongo_custom_kanji_${s}`); if (raw) { const data = JSON.parse(raw); if (data.cards) custom = data.cards; } } catch {}
      }
      const combined = [...base, ...dbData, ...custom];
      allKanjiCache.set(s, combined);
      all.push(...combined);
    }
    return all;
  }

  function startQuiz() {
    const sessions = [...selectedSessions];
    if (sessions.length === 0) return;
    loadKanjiForSessions(sessions).then(kanjiData => {
      const qs = generateJLPTQuestions(kanjiData, quizMode, questionCount);
      if (qs.length === 0) return;
      setQuestions(qs);
      setIdx(0); setScore(0); setSelected(null); setWrongCards([]); setShowExample(false); setStarted(true);
    });
  }

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
    const isCorrect = questions[idx].options[i] === questions[idx].correctAnswer;
    if (isCorrect) { setScore((s) => s + 1); setShowExample(true); return; }
    else { setWrongCards(prev => [...prev, questions[idx]]); }
    setTimeout(() => goNext(), 1200);
  }

  function goNext() {
    setSelected(null); setShowExample(false);
    if (idx + 1 >= questions.length) { setIdx(idx + 1); } else { setIdx(prev => prev + 1); }
  }

  function toggleSession(s: number) {
    const next = new Set(selectedSessions);
    next.has(s) ? next.delete(s) : next.add(s);
    setSelectedSessions(next);
  }

  // === CONFIG ===
  if (!started) {
    if (!mounted) return null;
    const totalKanji = [...selectedSessions].reduce((sum, s) => sum + (allSessions.get(s) || 0), 0);

    if (questions.length > 0 && idx >= questions.length) {
      const pct = Math.round((score / questions.length) * 100);
      return (
        <div className="min-h-screen p-4 pb-24 flex flex-col items-center max-w-md mx-auto">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-xl font-bold text-gray-800">Kết quả JLPT Quiz</p>
          <p className="text-3xl font-bold text-indigo-600 mt-3">{score}/{questions.length}</p>
          <p className="text-sm text-gray-500 mt-1">{pct}% đúng</p>
          <div className="flex gap-3 mt-6 flex-wrap justify-center">
            <button onClick={() => { setIdx(0); setScore(0); setWrongCards([]); setQuestions(shuffle(questions)); }}
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow">🔄 Làm lại</button>
            {wrongCards.length > 0 && (
              <button onClick={() => { const qs = shuffle(wrongCards); setQuestions(qs); setIdx(0); setScore(0); setWrongCards([]); }}
                className="px-5 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl font-medium shadow">
                🔄 Làm lại câu sai ({wrongCards.length})
              </button>
            )}
            <button onClick={() => { setQuestions([]); setScore(0); setWrongCards([]); }}
              className="px-5 py-2 bg-gray-200 rounded-xl font-medium">Cài đặt</button>
          </div>
          {wrongCards.length > 0 && (
            <div className="mt-8 w-full text-left">
              <h2 className="font-semibold text-red-500 mb-3">❌ Câu sai ({wrongCards.length})</h2>
              <div className="space-y-2">
                {wrongCards.map((c, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 border border-red-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800">{c.highlight}</span>
                      <span className="text-sm text-gray-500 ml-2">— {c.correctAnswer}</span>
                    </div>
                    <span className="text-xs text-gray-400">{c.sentence}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="min-h-screen p-4 pb-24 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">📝 JLPT Kanji Quiz</h1>
        <p className="text-sm text-gray-500 mb-6">{allSessions.size} buổi, {[...allSessions.values()].reduce((a, b) => a + b, 0)} kanji</p>

        {/* 📚 Chọn buổi */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">📚 <span>Chọn buổi</span></span>
            <button onClick={() => setSelectedSessions(selectedSessions.size === allSessions.size ? new Set() : new Set(allSessions.keys()))}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 transition-all">
              {selectedSessions.size === allSessions.size ? '🗑 Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...allSessions.keys()].sort((a, b) => a - b).map(s => (
              <button key={s} onClick={() => toggleSession(s)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  selectedSessions.has(s) ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                style={selectedSessions.has(s) ? { background: '#6C63FF' } : {}}>
                Buổi {s} <span className="opacity-70">({allSessions.get(s)})</span>
              </button>
            ))}
          </div>
          {selectedSessions.size > 0 && (
            <p className="text-xs text-gray-400 mt-2">Đã chọn {selectedSessions.size} buổi — Tổng: <strong>{totalKanji}</strong> kanji</p>
          )}
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* 🎯 Chọn dạng */}
        <div className="mb-6">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mb-3">🎯 <span>Chọn dạng</span></span>
          <div className="flex flex-col gap-1.5">
            {[
              { key: 'study' as QuizMode, label: '📖 Học', desc: 'Có nghĩa + giải thích' },
              { key: 'exam' as QuizMode, label: '📝 Luyện thi', desc: 'Dạng JLPT thật, không nghĩa' },
              { key: 'hard' as QuizMode, label: '🔥 Khó', desc: 'Chỉ kanji, nhớ cách đọc' },
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
            <input type="number" min={1} max={totalKanji} value={questionCount}
              onChange={e => setQuestionCount(Math.max(1, Math.min(totalKanji, Number(e.target.value) || 1)))}
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-center" />
            <span className="text-xs text-gray-400">/ {totalKanji} câu</span>
            <button onClick={() => setQuestionCount(totalKanji)} className="text-xs px-3 py-1.5 rounded-xl font-medium text-white shadow-sm" style={{ background: '#6C63FF' }}>Tất cả</button>
          </div>
        </div>

        <button onClick={startQuiz} disabled={totalKanji < 4}
          className="w-full py-4 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}>
          <span className="text-base">🚀 Bắt đầu</span>
          <span className="block text-xs font-normal mt-0.5 opacity-80">{Math.min(questionCount, totalKanji)} câu • {totalKanji} kanji • {{ study: 'Học', exam: 'Luyện thi', hard: 'Khó' }[quizMode]}</span>
        </button>
      </div>
    );
  }

  // === QUIZ ===
  if (questions.length === 0) return <div className="min-h-screen p-4 flex items-center justify-center text-gray-500">Đang tạo đề...</div>;

  const q = questions[idx];
  const isExam = quizMode === 'exam';
  const isHard = quizMode === 'hard';
  const opts = ['①', '②', '③', '④'];

  function highlightTarget(text: string, target: string): string {
    const i = text.indexOf(target);
    if (i === -1) return text;
    return text.slice(0, i) + '【' + target + '】' + text.slice(i + target.length);
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Compact header with progress */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">
              {{
                study: '📖 Học',
                exam: '📝 Luyện thi',
                hard: '🔥 Khó'
              }[quizMode]}
            </span>
            {!isHard && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                {q.type === 'reading-to-kanji' ? '漢字表記' : '読み方'}
              </span>
            )}
          </div>
          <span className="text-xs text-emerald-600 font-semibold">✓ {score}</span>
        </div>

        {/* Duolingo-style progress bar */}
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all duration-300 flex items-center justify-end pr-1"
            style={{ width: `${((idx + 1) / questions.length) * 100}%`, background: '#6C63FF', minWidth: '24px' }}>
            {((idx + 1) / questions.length) * 100 > 15 && (
              <span className="text-[9px] text-white font-bold">{idx + 1}/{questions.length}</span>
            )}
          </div>
        </div>
        {((idx + 1) / questions.length) * 100 <= 15 && (
          <p className="text-[10px] text-gray-400 mb-1">{idx + 1}/{questions.length}</p>
        )}

        {/* Question card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          {/* Meaning sentence (hidden in exam/hard) */}
          {!isExam && !isHard && q.sentence && (
            <p className="text-xs text-gray-400 mb-2" dangerouslySetInnerHTML={{
              __html: q.highlightMeaning
                ? q.sentence.replace(new RegExp(`(${q.highlightMeaning})`, 'gi'), '<span class="font-semibold text-gray-600">$1</span>')
                : q.sentence
            }} />
          )}

          {/* Target word with 【】highlight */}
          {q.type === 'reading-to-kanji' ? (
            // Reading → Kanji: show reading in 【】 with yellow bg
            <div className="text-center py-3">
              <p className="text-xl sm:text-2xl leading-relaxed text-gray-700">
                {(() => {
                  const h = q.highlightReading
                    ? q.highlight.replace(new RegExp(`(${q.highlightReading})`, 'g'), '【$1】')
                    : `【${q.highlight}】`;
                  // Get the full sentence context
                  const ctx = q.sentence || '';
                  return ctx ? ctx.replace(q.highlight, h) : h;
                })()}
              </p>
              <div className="mt-3 inline-block px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xl sm:text-2xl font-bold text-amber-800">
                {q.highlightReading
                  ? q.highlight.replace(new RegExp(`(${q.highlightReading})`, 'g'), '【$1】')
                  : `【${q.highlight}】`}
              </div>
            </div>
          ) : (
            // Kanji → Reading: show kanji with 【】 and amber bg
            <div className="text-center py-3">
              <div className="inline-block px-5 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {q.vocabHighlight
                    ? `【${q.vocabHighlight}】`
                    : `【${q.highlight}】`}
                </span>
              </div>
            </div>
          )}

          {/* Audio button */}
          <div className="flex justify-center mt-2">
            <button onClick={() => speak(q.highlight)}
              className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-150"
              aria-label="Nghe">
              <span className="text-xl">🔊</span>
            </button>
          </div>
        </div>

        {/* Options with ①②③④ */}
        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            let cls = 'bg-white border-2 border-gray-200 hover:border-indigo-300 scale-100';
            if (selected !== null) {
              if (opt === q.correctAnswer) cls = 'bg-emerald-100 border-emerald-500 border-[3px] text-emerald-800 font-bold scale-[1.02] pop';
              else if (i === selected) cls = 'bg-red-100 border-red-500 border-[3px] text-red-700 shake';
            }
            const circleCls = selected !== null && opt === q.correctAnswer
              ? 'bg-emerald-500 text-white'
              : selected !== null && i === selected
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-500';
            return (
              <button key={i} disabled={selected !== null} onClick={() => handleSelect(i)}
                className={`${cls} w-full py-3.5 px-4 rounded-xl font-medium text-left transition-all duration-200 shadow-sm flex items-center gap-3`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${circleCls}`}>
                  {selected !== null && opt === q.correctAnswer ? '✓' : opts[i]}
                </span>
                <span className={`text-base sm:text-lg ${selected !== null && opt === q.correctAnswer ? 'font-bold' : ''}`}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Rich answer explanation */}
        {showExample && (
          <div className={`mt-4 rounded-xl p-4 border ${(selected === null || q.options[selected] === q.correctAnswer) ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-bold mb-2 flex items-center gap-1 ${selected !== null && q.options[selected] === q.correctAnswer ? 'text-emerald-700' : 'text-red-600'}`}>
              {selected !== null && q.options[selected] === q.correctAnswer ? '✅ Chính xác' : '✗ Sai'}
            </p>
            <div className="bg-white rounded-lg p-3 border border-gray-100 space-y-1.5">
              <p className="text-lg font-bold text-gray-800">
                {q.card.word || q.highlight}
                <span className="text-sm font-normal text-gray-500 ml-2">（{q.card.reading}）</span>
              </p>
              {q.card.hanViet && <p className="text-xs text-gray-400">{q.card.hanViet}</p>}
              {q.sentence && <p className="text-xs text-gray-500 leading-relaxed">{q.sentence}</p>}
            </div>
            {selected !== null && q.options[selected] !== q.correctAnswer && (
              <p className="text-xs text-red-500 mt-2">Đáp án đúng: <span className="font-bold">{q.correctAnswer}</span></p>
            )}
            <button onClick={goNext}
              className="mt-3 w-full py-2.5 text-white rounded-lg text-sm font-medium shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
              style={{ background: '#6C63FF' }}>
              {idx + 1 >= questions.length ? 'Xem kết quả' : 'Tiếp →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
