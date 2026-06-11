'use client';

import { useState, useEffect } from 'react';
import { sessionKanji, SessionKanjiEntry } from '@/data/session-kanji';
import { getSessionData, getAllSessionData } from '@/lib/session-data';

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

type Question = {
  type: 'reading-to-kanji' | 'kanji-to-reading';
  sentence: string;
  highlight: string;
  highlightMeaning?: string;
  vocabHighlight?: string;
  highlightReading?: string;
  correctAnswer: string;
  options: string[];
};

function generateJLPTQuestions(kanjiData: SessionKanjiEntry[], count = 35): Question[] {
  const questions: Question[] = [];
  const allVocab = kanjiData.flatMap((k) => k.vocab.map((v) => ({ ...v, kanji: k.kanji, hanViet: k.hanViet })));

  for (let i = 0; i < count && allVocab.length > 0; i++) {
    const vocab = allVocab[i % allVocab.length];
    const isType2 = Math.random() < 0.5; // 50% each type

    if (isType2) {
      // Mondai 2: Show reading (hiragana) in sentence → pick correct kanji word
      // Generate wrong options by replacing kanji in the word with other kanji
      const wrongOptions = shuffle(kanjiData.filter((k) => k.kanji !== vocab.kanji))
        .slice(0, 3)
        .map((k) => vocab.word.replace(new RegExp(`[${vocab.kanji}]`, 'g'), k.kanji) || k.kanji + vocab.word.slice(1));

      questions.push({
        type: 'reading-to-kanji',
        sentence: `${vocab.meaning}`,
        highlight: vocab.reading,
        highlightMeaning: (vocab as { highlightMeaning?: string }).highlightMeaning,
        highlightReading: (vocab as { highlightReading?: string }).highlightReading,
        vocabHighlight: (vocab as { highlight?: string }).highlight || vocab.kanji,
        correctAnswer: vocab.word,
        options: shuffle([vocab.word, ...wrongOptions.slice(0, 3)]).slice(0, 4),
      });
    } else {
      // Mondai 3: Show kanji word → pick correct reading
      const wrongReadings = shuffle(allVocab.filter((v) => v.reading !== vocab.reading))
        .slice(0, 3)
        .map((v) => v.reading);

      questions.push({
        type: 'kanji-to-reading',
        sentence: `${vocab.meaning}`,
        highlight: vocab.word,
        highlightMeaning: (vocab as { highlightMeaning?: string }).highlightMeaning,
        vocabHighlight: (vocab as { highlight?: string }).highlight || vocab.kanji,
        correctAnswer: vocab.reading,
        options: shuffle([vocab.reading, ...wrongReadings.slice(0, 3)]).slice(0, 4),
      });
    }
  }

  return shuffle(questions);
}

export default function JLPTQuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sessionList, setSessionList] = useState<{ session: number; count: number }[]>([]);
  const [allKanjiCache, setAllKanjiCache] = useState<SessionKanjiEntry[]>([]);

  useEffect(() => {
    setMounted(true);
    loadSessions();
  }, []);

  async function loadSessions() {
    // Get sessions from Supabase
    const dbSessions = await getAllSessionData();
    const kanjiSessions = dbSessions.filter((s) => s.type === 'kanji');

    // Merge with static sessionKanji keys and localStorage
    const sessionMap = new Map<number, number>();
    Object.entries(sessionKanji).forEach(([k, v]) => sessionMap.set(Number(k), v.length));
    kanjiSessions.forEach((s) => sessionMap.set(s.session_num, (sessionMap.get(s.session_num) || 0) + s.count));

    if (typeof window !== 'undefined') {
      Object.keys(localStorage).filter((k) => k.startsWith('nihongo_custom_kanji_')).forEach((key) => {
        const num = parseInt(key.replace('nihongo_custom_kanji_', ''));
        try { const data = JSON.parse(localStorage.getItem(key) || ''); if (data.cards) sessionMap.set(num, (sessionMap.get(num) || 0) + data.cards.length); } catch {}
      });
    }

    setSessionList([...sessionMap.entries()].map(([session, count]) => ({ session, count })).sort((a, b) => a.session - b.session));
  }

  async function getFullSessionKanji(session: number): Promise<SessionKanjiEntry[]> {
    const base = sessionKanji[session] || [];
    const dbData = await getSessionData(session, 'kanji') as SessionKanjiEntry[];
    let custom: SessionKanjiEntry[] = [];
    if (typeof window !== 'undefined') {
      try { const raw = localStorage.getItem(`nihongo_custom_kanji_${session}`); if (raw) { const data = JSON.parse(raw); if (data.cards) custom = data.cards; } } catch {}
    }
    return [...base, ...dbData, ...custom];
  }

  async function loadAllKanji(): Promise<SessionKanjiEntry[]> {
    if (allKanjiCache.length) return allKanjiCache;
    const all = Object.values(sessionKanji).flat();
    const dbSessions = await getAllSessionData();
    const kanjiSessionNums = dbSessions.filter((s) => s.type === 'kanji').map((s) => s.session_num);
    for (const num of kanjiSessionNums) {
      const data = await getSessionData(num, 'kanji') as SessionKanjiEntry[];
      all.push(...data);
    }
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).filter((k) => k.startsWith('nihongo_custom_kanji_')).forEach((key) => {
        try { const data = JSON.parse(localStorage.getItem(key) || ''); if (data.cards) all.push(...data.cards); } catch {}
      });
    }
    setAllKanjiCache(all);
    return all;
  }

  function startQuiz(kanjiData: SessionKanjiEntry[]) {
    setQuestions(generateJLPTQuestions(kanjiData, 35));
    setIdx(0); setScore(0); setSelected(null); setStarted(true);
  }

  // Session selector
  if (!started) {
    if (!mounted) return null;

    return (
      <div className="min-h-screen p-4 pb-24 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">📝 JLPT Kanji Quiz</h1>
        <p className="text-sm text-gray-500 mb-5">{sessionList.reduce((a, b) => a + b.count, 0)} kanji • {sessionList.length} buổi</p>

        <a href="/quiz?mode=import" className="block w-full py-4 mb-4 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all text-center" style={{ background: '#22C55E' }}>
          ✍️ Trắc nghiệm Kanji
        </a>

        <button onClick={async () => startQuiz(await loadAllKanji())}
          className="w-full py-4 mb-6 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all" style={{ background: '#6C63FF' }}>
          🎲 Tổng hợp tất cả ({sessionList.reduce((a, b) => a + b.count, 0)} kanji)
        </button>

        <div className="space-y-2.5">
          {sessionList.map(({ session, count }) => (
            <button key={session} onClick={async () => startQuiz(await getFullSessionKanji(session))}
              className="w-full flex items-center justify-between bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-[#6C63FF]/40 transition-all">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6C63FF' }}>{session}</span>
                <span className="font-semibold text-gray-800">Buổi {session}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: '#6C63FF' }}>{count} kanji</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (questions[idx].options[i] === questions[idx].correctAnswer) setScore((s) => s + 1);
    setTimeout(() => {
      setSelected(null);
      setIdx((prev) => prev + 1);
    }, 1200);
  }

  if (questions.length === 0) return <div className="min-h-screen p-4 flex items-center justify-center text-gray-500">Đang tạo đề...</div>;

  // Summary
  if (idx >= questions.length) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">🏆</p>
        <p className="text-xl font-bold text-gray-800">Kết quả JLPT Quiz</p>
        <p className="text-4xl font-bold text-indigo-600 mt-3">{score}/{questions.length}</p>
        <p className="text-sm text-gray-500 mt-1">{Math.round((score / questions.length) * 100)}% đúng</p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { setIdx(0); setScore(0); setQuestions(shuffle(questions)); }} className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-medium shadow">🔄 Làm lại</button>
          <button onClick={() => setStarted(false)} className="px-5 py-3 bg-gray-200 rounded-xl font-medium">← Chọn buổi khác</button>
        </div>
      </div>
    );
  }

  const q = questions[idx];

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">📝 JLPT Quiz</h1>
        <span className="text-sm text-gray-500">{idx + 1}/{questions.length} • ✓{score}</span>
      </div>

      {/* Question type label */}
      <div className="text-xs text-gray-400 mb-3">
        {q.type === 'reading-to-kanji'
          ? '問題2: ＿＿の言葉を漢字で書くとき、最もよいものを選びなさい。'
          : '問題3: ＿＿の言葉の読み方として最もよいものを選びなさい。'}
      </div>

      {/* Sentence with highlight */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <p className="text-sm text-gray-500 mb-2" dangerouslySetInnerHTML={{ __html: q.highlightMeaning ? q.sentence.replace(new RegExp(`(${q.highlightMeaning})`, 'gi'), '<span class="underline decoration-amber-400 decoration-2 underline-offset-4 font-bold text-gray-800">$1</span>') : q.sentence }} />
        <p className="text-xl font-bold text-gray-800">
          {q.type === 'reading-to-kanji' ? (
            <span dangerouslySetInnerHTML={{ __html: q.highlightReading ? q.highlight.replace(new RegExp(`(${q.highlightReading})`, 'g'), '<span class="text-amber-400 font-bold">$1</span>') : `<span class="text-amber-400 font-bold">${q.highlight}</span>` }} />
          ) : (
            <span dangerouslySetInnerHTML={{ __html: q.vocabHighlight ? q.highlight.replace(new RegExp(`(${q.vocabHighlight})`, 'g'), '<span class="text-amber-500 font-bold">$1</span>') : q.highlight }} />
          )}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map((opt, i) => {
          let cls = 'bg-white border-2 border-gray-200 hover:border-indigo-300';
          if (selected !== null) {
            if (opt === q.correctAnswer) cls = 'bg-emerald-100 border-2 border-emerald-400';
            else if (i === selected) cls = 'bg-red-100 border-2 border-red-400';
          }
          return (
            <button key={i} disabled={selected !== null} onClick={() => handleSelect(i)}
              className={`${cls} w-full py-4 px-5 rounded-xl font-medium text-left transition-all shadow-sm text-lg`}>
              <span className="text-gray-400 mr-3">{i + 1}</span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
