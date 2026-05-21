'use client';

import { useEffect, useState } from 'react';
import { loadProgress, saveProgress, reviewCardProgress, learnCard } from '@/lib/store';
import { getDueCards, ReviewResult } from '@/lib/srs';
import { vocabLessons1to10 } from '@/data/vocabulary/lessons-1-10';
import { vocabLessons11to25 } from '@/data/vocabulary/lessons-11-25';
import { vocabLessons26to40 } from '@/data/vocabulary/lessons-26-40';
import { vocabLessons41to50 } from '@/data/vocabulary/lessons-41-50';
import FlashCard from '@/app/components/FlashCard';

const allVocab = [...vocabLessons1to10, ...vocabLessons11to25, ...vocabLessons26to40, ...vocabLessons41to50];

export default function FlashcardPage() {
  const [dueCards, setDueCards] = useState<{ id: string; japanese: string; reading: string; meaning: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    let p = loadProgress();
    const lessonVocab = allVocab.filter((v) => v.lesson <= p.currentLesson);
    lessonVocab.slice(0, 20).forEach((v) => { p = learnCard(p, `vocab-${v.japanese}`); });
    saveProgress(p);
    const due = getDueCards(p.cards);
    const mapped = due.slice(0, 20).map((card) => {
      // Handle both formats: "vocab-{japanese}" and "vocab-{lesson}-{japanese}"
      let japanese = '';
      if (card.id.match(/^vocab-\d+-/)) {
        japanese = card.id.replace(/^vocab-\d+-/, '');
      } else {
        japanese = card.id.replace(/^vocab-/, '');
      }
      const vocab = allVocab.find((v) => v.japanese === japanese);
      return { id: card.id, japanese: vocab?.japanese || japanese, reading: vocab?.reading || '', meaning: vocab?.meaning || '' };
    }).filter((c) => c.japanese);
    setDueCards(mapped);
  }, []);

  const handleRate = (result: ReviewResult) => {
    const card = dueCards[currentIndex];
    const updated = reviewCardProgress(loadProgress(), card.id, result);
    saveProgress(updated);
    if (currentIndex + 1 >= dueCards.length) setSessionDone(true);
    else setCurrentIndex((i) => i + 1);
  };

  if (dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-xl font-bold text-gray-700">Không có thẻ cần ôn!</p>
        <p className="text-sm text-gray-400 mt-2">Hãy học thêm từ mới trong Bài học.</p>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <p className="text-5xl mb-4">✅</p>
        <p className="text-xl font-bold text-gray-700">Hoàn thành!</p>
        <p className="text-sm text-gray-400 mt-2">Bạn đã ôn {dueCards.length} thẻ.</p>
        <button onClick={() => { setCurrentIndex(0); setSessionDone(false); }}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium shadow-md">
          Ôn lại
        </button>
      </div>
    );
  }

  const card = dueCards[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <p className="text-sm text-gray-500 mb-6 font-medium">{currentIndex + 1} / {dueCards.length} thẻ</p>
      <FlashCard front={card.japanese} reading={card.reading} meaning={card.meaning} onRate={handleRate} />
      <p className="text-xs text-gray-400 mt-4">Nhấn thẻ để lật</p>
    </div>
  );
}
