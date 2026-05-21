'use client';

import { useState, useEffect, useCallback } from 'react';
import QuizCard from '../components/QuizCard';
import { hiragana } from '../../data/hiragana';
import { katakana } from '../../data/katakana';
import { vocabLessons1to10 } from '../../data/vocabulary/lessons-1-10';
import { vocabLessons11to25 } from '../../data/vocabulary/lessons-11-25';
import { grammar } from '../../data/grammar';

type QuizMode = 'Kana' | 'Vocabulary' | 'Grammar';
type Question = { question: string; options: string[]; correctIndex: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(mode: QuizMode, count = 10): Question[] {
  if (mode === 'Kana') {
    const pool = shuffle([...hiragana, ...katakana]);
    return pool.slice(0, count).map((item) => {
      const wrong = shuffle(pool.filter((k) => k.romaji !== item.romaji))
        .slice(0, 3)
        .map((k) => k.romaji);
      const options = shuffle([item.romaji, ...wrong]);
      return { question: item.character, options, correctIndex: options.indexOf(item.romaji) };
    });
  }
  if (mode === 'Vocabulary') {
    const pool = shuffle([...vocabLessons1to10, ...vocabLessons11to25]);
    return pool.slice(0, count).map((item) => {
      const wrong = shuffle(pool.filter((v) => v.meaning !== item.meaning))
        .slice(0, 3)
        .map((v) => v.meaning);
      const options = shuffle([item.meaning, ...wrong]);
      return { question: item.japanese, options, correctIndex: options.indexOf(item.meaning) };
    });
  }
  // Grammar
  const pool = shuffle([...grammar]);
  return pool.slice(0, count).map((item) => {
    const wrong = shuffle(pool.filter((g) => g.meaning !== item.meaning))
      .slice(0, 3)
      .map((g) => g.meaning);
    const options = shuffle([item.meaning, ...wrong]);
    return { question: item.pattern, options, correctIndex: options.indexOf(item.meaning) };
  });
}

export default function QuizPage() {
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(10);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!mode || finished || questions.length === 0) return;
    if (timer <= 0) {
      advance(false);
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer, mode, finished, questions.length]);

  function startQuiz(m: QuizMode) {
    setMode(m);
    setQuestions(generateQuestions(m));
    setCurrent(0);
    setScore(0);
    setTimer(10);
    setFinished(false);
  }

  const advance = useCallback((correct: boolean) => {
    if (correct) setScore((s) => s + 1);
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setTimer(10);
    }
  }, [current, questions.length]);

  // Mode selector
  if (!mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4">
        <h1 className="text-4xl font-bold text-gray-800">⚡ Quiz</h1>
        <p className="text-gray-500">Chọn chế độ kiểm tra</p>
        <div className="flex gap-4 flex-wrap justify-center">
          {([['Kana', 'from-pink-400 to-rose-500'], ['Vocabulary', 'from-sky-400 to-blue-500'], ['Grammar', 'from-violet-400 to-purple-500']] as [QuizMode, string][]).map(([m, color]) => (
            <button
              key={m}
              onClick={() => startQuiz(m)}
              className={`bg-gradient-to-r ${color} text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-lg transition-transform hover:scale-105`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Results
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-4xl font-bold text-gray-800">🎉 Kết quả</h1>
        <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">{pct}%</div>
        <p className="text-gray-600 text-xl">{score} / {questions.length} đúng</p>
        <div className="flex gap-4 mt-4">
          <button onClick={() => startQuiz(mode)} className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold py-3 px-6 rounded-xl shadow">
            Thử lại
          </button>
          <button onClick={() => setMode(null)} className="bg-white border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl shadow-sm">
            Đổi mode
          </button>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 pb-24">
      <div className="w-full max-w-lg flex justify-between text-gray-500 text-sm">
        <span className="font-medium">{mode}</span>
        <span>Câu {current + 1}/{questions.length}</span>
        <span className="font-medium text-emerald-500">✓ {score}</span>
      </div>
      <div className="w-full max-w-lg h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 rounded-full" style={{ width: `${(timer / 10) * 100}%` }} />
      </div>
      <div className="text-gray-400 text-sm">{timer}s</div>
      <QuizCard
        question={questions[current].question}
        options={questions[current].options}
        correctIndex={questions[current].correctIndex}
        onAnswer={advance}
      />
    </div>
  );
}
