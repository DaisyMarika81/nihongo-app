'use client';

import { useState, useCallback } from 'react';
import { vocabLessons1to10 } from '@/data/vocabulary/lessons-1-10';
import { vocabLessons11to25 } from '@/data/vocabulary/lessons-11-25';
import { speak } from '@/lib/speak';

const pool = [...vocabLessons1to10, ...vocabLessons11to25];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestion() {
  const shuffled = shuffle(pool);
  const correct = shuffled[0];
  const options = shuffle([correct, ...shuffled.slice(1, 4)]);
  return { correct, options, correctIndex: options.indexOf(correct) };
}

export default function ListenPracticePage() {
  const [question, setQuestion] = useState(generateQuestion);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const next = useCallback(() => {
    setQuestion(generateQuestion());
    setSelected(null);
  }, []);

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
    setScore((s) => ({
      correct: s.correct + (i === question.correctIndex ? 1 : 0),
      total: s.total + 1,
    }));
    setTimeout(next, 1500);
  }

  function playAudio() {
    speak(question.correct.japanese);
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">👂 Nghe & Chọn</h1>
      <p className="text-sm text-gray-500 mb-6">Đúng: {score.correct}/{score.total}</p>

      <div className="flex justify-center mb-8">
        <button onClick={playAudio} className="w-24 h-24 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-4xl text-white shadow-lg hover:scale-110 transition-transform">
          🔊
        </button>
      </div>

      <p className="text-center text-sm text-gray-400 mb-6">Nhấn để nghe, chọn nghĩa đúng</p>

      <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
        {question.options.map((opt, i) => {
          let cls = 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300';
          if (selected !== null) {
            if (i === question.correctIndex) cls = 'bg-emerald-100 border-2 border-emerald-400 text-emerald-700';
            else if (i === selected) cls = 'bg-red-100 border-2 border-red-400 text-red-700';
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null}
              className={`${cls} py-4 px-6 rounded-xl font-medium text-left transition-all shadow-sm`}>
              {opt.meaning}
            </button>
          );
        })}
      </div>
    </div>
  );
}
