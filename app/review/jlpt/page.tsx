'use client';

import { useState, useEffect } from 'react';
import { sessionKanji, SessionKanjiEntry } from '@/data/session-kanji';

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

type Question = {
  type: 'reading-to-kanji' | 'kanji-to-reading';
  sentence: string;
  highlight: string; // the word being tested
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

  useEffect(() => {
    const allKanji = Object.values(sessionKanji).flat();
    // Also load custom uploaded kanji
    const customKeys = Object.keys(localStorage).filter((k) => k.startsWith('nihongo_custom_kanji_'));
    customKeys.forEach((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '');
        if (data.cards) allKanji.push(...data.cards);
      } catch {}
    });
    setQuestions(generateJLPTQuestions(allKanji, 35));
  }, []);

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
        <p className="text-base text-gray-600 mb-2">{q.sentence}</p>
        <p className="text-xl font-bold text-gray-800">
          {q.type === 'reading-to-kanji' ? (
            <span className="underline decoration-rose-400 decoration-2 underline-offset-4">{q.highlight}</span>
          ) : (
            <span className="underline decoration-indigo-400 decoration-2 underline-offset-4">{q.highlight}</span>
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
