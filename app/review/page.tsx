'use client';

import { useState, useEffect, useRef } from 'react';
import { getDueKanji, reviewKanji, getKanjiStats, loadKanjiSRS, addKanjiToSRS } from '@/lib/kanji-srs-store';
import { KanjiSRSCard } from '@/lib/kanji-srs';
import { sessionKanji } from '@/data/session-kanji';
import { speak } from '@/lib/speak';

type QuizType = 'kanji-to-hanviet' | 'word-to-meaning' | 'meaning-to-word' | 'reading-to-kanji';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function DailyReviewPage() {
  const [dueCards, setDueCards] = useState<KanjiSRSCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [quizType, setQuizType] = useState<QuizType>('word-to-meaning');
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [stats, setStats] = useState({ total: 0, due: 0, mastered: 0 });
  const [currentVocab, setCurrentVocab] = useState<{ word: string; reading: string; meaning: string } | null>(null);
  const startTime = useRef(Date.now());

  // All kanji data for generating options
  const allKanjiData = Object.values(sessionKanji).flat();

  useEffect(() => {
    // Auto-add session kanji to SRS if not already
    allKanjiData.forEach((k) => addKanjiToSRS(k.kanji));
    // Get due cards, but always serve at least 35 questions (cycle if needed)
    const due = getDueKanji();
    const pool = due.length > 0 ? due : Object.values(loadKanjiSRS());
    const shuffled = shuffle(pool);
    // Repeat to fill 35 if not enough
    const filled: KanjiSRSCard[] = [];
    while (filled.length < 35 && shuffled.length > 0) {
      filled.push(...shuffled.slice(0, 35 - filled.length));
    }
    setDueCards(filled.slice(0, 35));
    setStats(getKanjiStats());
    if (filled.length > 0) generateQuestion(filled.slice(0, 35), 0);
  }, []);

  function generateQuestion(cards: KanjiSRSCard[], idx: number) {
    const card = cards[idx];
    const kanjiData = allKanjiData.find((k) => k.kanji === card.kanji);
    if (!kanjiData) return;

    // Pick a random vocab example
    const vocab = kanjiData.vocab[Math.floor(Math.random() * kanjiData.vocab.length)];

    // 70% word-based questions, 30% single kanji
    const rand = Math.random();
    let type: QuizType;

    if (rand < 0.35) {
      // Dạng 1: Hiện từ vựng (word) → chọn nghĩa đúng
      type = 'word-to-meaning';
    } else if (rand < 0.70) {
      // Dạng 2: Hiện nghĩa → chọn từ vựng (word) đúng
      type = 'meaning-to-word';
    } else if (rand < 0.85) {
      // Dạng 3: Kanji → Hán Việt
      type = 'kanji-to-hanviet';
    } else {
      // Dạng 4: Reading gạch chân → chọn Kanji
      type = 'reading-to-kanji';
    }

    setQuizType(type);

    let correct: string;
    let pool: string[];
    const allVocab = allKanjiData.flatMap((k) => k.vocab);

    if (type === 'word-to-meaning') {
      correct = vocab.meaning;
      pool = shuffle(allVocab.filter((v) => v.meaning !== correct)).slice(0, 3).map((v) => v.meaning);
    } else if (type === 'meaning-to-word') {
      correct = vocab.word;
      pool = shuffle(allVocab.filter((v) => v.word !== correct)).slice(0, 3).map((v) => v.word);
    } else if (type === 'kanji-to-hanviet') {
      correct = kanjiData.hanViet;
      pool = shuffle(allKanjiData.filter((k) => k.hanViet !== correct)).slice(0, 3).map((k) => k.hanViet);
    } else {
      correct = kanjiData.kanji;
      pool = shuffle(allKanjiData.filter((k) => k.kanji !== correct)).slice(0, 3).map((k) => k.kanji);
    }

    setOptions(shuffle([correct, ...pool]));
    setCurrentVocab(vocab);
    startTime.current = Date.now();
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);

    const card = dueCards[currentIdx];
    const kanjiData = allKanjiData.find((k) => k.kanji === card.kanji);
    if (!kanjiData) return;

    let correctAnswer: string;
    if (quizType === 'kanji-to-hanviet') correctAnswer = kanjiData.hanViet;
    else if (quizType === 'word-to-meaning') correctAnswer = currentVocab?.meaning || '';
    else if (quizType === 'meaning-to-word') correctAnswer = currentVocab?.word || '';
    else correctAnswer = kanjiData.kanji;

    const isCorrect = options[idx] === correctAnswer;
    const responseTime = Date.now() - startTime.current;

    reviewKanji(card.kanji, isCorrect, responseTime);
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));

    setTimeout(() => {
      setSelected(null);
      if (currentIdx + 1 >= dueCards.length) {
        setCurrentIdx(dueCards.length);
      } else {
        const next = currentIdx + 1;
        setCurrentIdx(next);
        generateQuestion(dueCards, next);
      }
    }, 1200);
  }

  // No cards due
  if (dueCards.length === 0) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">✨</p>
        <p className="text-xl font-bold text-gray-800">Không có Kanji cần ôn hôm nay!</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>📊 Tổng: {stats.total} | 🏆 Thuộc: {stats.mastered}</p>
        </div>
      </div>
    );
  }

  // Summary
  if (currentIdx >= dueCards.length) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">🏆</p>
        <p className="text-xl font-bold text-gray-800">Ôn tập xong!</p>
        <p className="text-3xl font-bold text-indigo-600 mt-3">{score.correct}/{score.total}</p>
        <p className="text-sm text-gray-500 mt-1">{Math.round((score.correct / score.total) * 100)}% đúng</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>📊 Tổng Kanji: {stats.total} | 🏆 Đã thuộc: {stats.mastered}</p>
        </div>
        <button onClick={() => { setCurrentIdx(0); setScore({ correct: 0, total: 0 }); setDueCards(shuffle(getDueKanji())); }}
          className="mt-6 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium shadow">
          🔄 Ôn lại
        </button>
      </div>
    );
  }

  const card = dueCards[currentIdx];
  const kanjiData = allKanjiData.find((k) => k.kanji === card.kanji);

  const typeLabel = {
    'kanji-to-hanviet': 'Kanji→Hán Việt',
    'word-to-meaning': 'Từ→Nghĩa',
    'meaning-to-word': 'Nghĩa→Từ',
    'reading-to-kanji': 'Reading→Kanji',
  }[quizType];

  let correctAnswer: string;
  if (quizType === 'kanji-to-hanviet') correctAnswer = kanjiData?.hanViet || '';
  else if (quizType === 'word-to-meaning') correctAnswer = currentVocab?.meaning || '';
  else if (quizType === 'meaning-to-word') correctAnswer = currentVocab?.word || '';
  else correctAnswer = kanjiData?.kanji || '';

  return (
    <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
      <h1 className="text-xl font-bold text-gray-800 mb-2">📅 Ôn Kanji hôm nay</h1>
      <p className="text-sm text-gray-500 mb-1">Câu {currentIdx + 1}/{dueCards.length} • Đúng: {score.correct}</p>
      <p className="text-xs text-gray-400 mb-6">Dạng: {typeLabel}</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-6 w-full max-w-md">
        {quizType === 'kanji-to-hanviet' && (
          <p className="text-7xl font-bold text-gray-800">{card.kanji}</p>
        )}
        {quizType === 'word-to-meaning' && currentVocab && (
          <>
            <p className="text-2xl font-bold text-gray-800">{currentVocab.word}</p>
            <p className="text-sm text-gray-400 mt-1">{currentVocab.reading}</p>
          </>
        )}
        {quizType === 'meaning-to-word' && currentVocab && (
          <p className="text-lg font-bold text-gray-800">{currentVocab.meaning}</p>
        )}
        {quizType === 'reading-to-kanji' && currentVocab && (
          <>
            <p className="text-xl font-bold text-gray-800">
              <span className="underline decoration-rose-400 decoration-2 underline-offset-4 text-rose-600">{currentVocab.reading}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">({currentVocab.meaning})</p>
          </>
        )}
        <p className="text-sm text-gray-400 mt-3">
          {quizType === 'kanji-to-hanviet' && 'Chọn âm Hán Việt đúng:'}
          {quizType === 'word-to-meaning' && 'Chọn nghĩa đúng:'}
          {quizType === 'meaning-to-word' && 'Chọn từ đúng:'}
          {quizType === 'reading-to-kanji' && 'Chọn Kanji đúng:'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {options.map((opt, i) => {
          let cls = 'bg-white border-2 border-gray-200 hover:border-indigo-300';
          if (selected !== null) {
            if (opt === correctAnswer) cls = 'bg-emerald-100 border-2 border-emerald-400';
            else if (i === selected) cls = 'bg-red-100 border-2 border-red-400';
          }
          const isLargeText = quizType === 'reading-to-kanji' || quizType === 'meaning-to-word';
          return (
            <button key={i} disabled={selected !== null} onClick={() => handleAnswer(i)}
              className={`${cls} py-4 px-2 rounded-xl font-bold transition-all shadow-sm ${isLargeText ? 'text-lg' : 'text-base'} leading-tight`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
