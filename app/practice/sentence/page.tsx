'use client';

import { useState, useCallback } from 'react';
import { grammar } from '@/data/grammar';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function splitSentence(s: string): string[] {
  return s.replace(/[。、]/g, '').split(/(?<=[\u3041-\u3096\u30A0-\u30FF\u4E00-\u9FFF])(?=[\u3041-\u3096\u30A0-\u30FF\u4E00-\u9FFF])/g)
    .flatMap((part) => {
      if (part.length <= 3) return [part];
      const mid = Math.ceil(part.length / 2);
      return [part.slice(0, mid), part.slice(mid)];
    });
}

function generateQuestion() {
  const item = grammar[Math.floor(Math.random() * grammar.length)];
  const words = splitSentence(item.example);
  return { answer: words, shuffled: shuffle(words), meaning: item.exampleMeaning, pattern: item.pattern };
}

export default function SentencePracticePage() {
  const [question, setQuestion] = useState(generateQuestion);
  const [placed, setPlaced] = useState<string[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const remaining = question.shuffled.filter((w, i) => !placed.includes(`${i}-${w}`));

  function handlePick(word: string, idx: number) {
    const key = `${idx}-${word}`;
    if (placed.includes(key)) return;
    const newPlaced = [...placed, key];
    setPlaced(newPlaced);

    if (newPlaced.length === question.shuffled.length) {
      const userAnswer = newPlaced.map((k) => k.split('-').slice(1).join('-')).join('');
      const correctAnswer = question.answer.join('');
      const isCorrect = userAnswer === correctAnswer;
      setResult(isCorrect ? 'correct' : 'wrong');
      setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    }
  }

  function removeLast() {
    setPlaced((p) => p.slice(0, -1));
    setResult(null);
  }

  const next = useCallback(() => {
    setQuestion(generateQuestion());
    setPlaced([]);
    setResult(null);
  }, []);

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🧩 Ghép câu</h1>
      <p className="text-sm text-gray-500 mb-6">Đúng: {score.correct}/{score.total}</p>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
        <p className="text-xs text-gray-400 mb-1">Mẫu: {question.pattern}</p>
        <p className="text-sm text-gray-600">{question.meaning}</p>
      </div>

      {/* Placed words */}
      <div className="min-h-[56px] bg-gray-50 rounded-xl p-3 mb-4 flex flex-wrap gap-2 border-2 border-dashed border-gray-200">
        {placed.map((key, i) => (
          <span key={i} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
            {key.split('-').slice(1).join('-')}
          </span>
        ))}
        {placed.length > 0 && !result && (
          <button onClick={removeLast} className="px-2 py-1 text-xs text-red-500">← Xóa</button>
        )}
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2 mb-6">
        {question.shuffled.map((word, i) => {
          const key = `${i}-${word}`;
          const used = placed.includes(key);
          return (
            <button key={i} onClick={() => handlePick(word, i)} disabled={used || result !== null}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${used ? 'opacity-30' : 'bg-white border border-gray-200 shadow-sm hover:border-indigo-300'}`}>
              {word}
            </button>
          );
        })}
      </div>

      {/* Result */}
      {result && (
        <div className="text-center">
          <p className={`text-lg font-bold mb-2 ${result === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
            {result === 'correct' ? '✅ Đúng!' : '❌ Sai!'}
          </p>
          {result === 'wrong' && <p className="text-sm text-gray-500 mb-2">Đáp án: {question.answer.join('')}</p>}
          <button onClick={next} className="px-6 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium shadow">
            Câu tiếp →
          </button>
        </div>
      )}
    </div>
  );
}
