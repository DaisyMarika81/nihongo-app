'use client';

import { useState, useEffect } from 'react';

type Props = {
  question: string;
  options: string[];
  correctIndex: number;
  onAnswer: (correct: boolean) => void;
};

export default function QuizCard({ question, options, correctIndex, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => { setSelected(null); }, [question]);

  useEffect(() => {
    if (selected === null) return;
    const timer = setTimeout(() => onAnswer(selected === correctIndex), 1500);
    return () => clearTimeout(timer);
  }, [selected, correctIndex, onAnswer]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-5xl font-bold text-gray-800">{question}</div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {options.map((opt, i) => {
          let cls = 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50';
          if (selected !== null) {
            if (i === correctIndex) cls = 'bg-emerald-100 border-2 border-emerald-400 text-emerald-700';
            else if (i === selected) cls = 'bg-red-100 border-2 border-red-400 text-red-700';
          }
          return (
            <button key={i} disabled={selected !== null} onClick={() => setSelected(i)}
              className={`${cls} font-semibold py-4 px-4 rounded-xl transition-all text-sm shadow-sm disabled:cursor-default`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
