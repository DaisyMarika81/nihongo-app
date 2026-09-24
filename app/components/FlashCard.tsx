'use client';

import { useEffect, useState } from 'react';
import { ReviewResult } from '@/lib/srs';
import { speak } from '@/lib/speak';

interface FlashCardProps {
  front: string;
  reading: string;
  meaning: string;
  onRate?: (rating: ReviewResult) => void;
}

export default function FlashCard({ front, reading, meaning, onRate }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))) return;
      event.preventDefault();
      setFlipped((value) => !value);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-[min(92vw,34rem)] sm:w-[min(88vw,40rem)] h-72 sm:h-80 cursor-pointer [perspective:1000px]" onClick={() => setFlipped(!flipped)} role="button" tabIndex={0} aria-label="Lật flashcard">
        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-xl [backface-visibility:hidden] p-6">
            <span className="text-6xl sm:text-8xl font-bold" style={{ color: '#fff' }}>{front}</span>
            <button onClick={(e) => { e.stopPropagation(); speak(front); }} className="mt-5 text-2xl opacity-80 hover:opacity-100 hover:scale-125 transition-transform" style={{ color: '#fff' }}>🔊</button>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 text-center">
            <span className="text-3xl sm:text-5xl font-bold" style={{ color: '#fff' }}>{reading}</span>
            <span className="text-xl sm:text-2xl" style={{ color: '#fff', opacity: 0.9 }}>{meaning}</span>
          </div>
        </div>
      </div>
      {flipped && onRate && (
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => { setFlipped(false); onRate('again'); }} className="px-4 py-2 rounded-xl bg-red-400 hover:bg-red-500 text-white font-medium shadow">Again</button>
          <button onClick={() => { setFlipped(false); onRate('hard'); }} className="px-4 py-2 rounded-xl bg-orange-400 hover:bg-orange-500 text-white font-medium shadow">Hard</button>
          <button onClick={() => { setFlipped(false); onRate('good'); }} className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-white font-medium shadow">Good</button>
          <button onClick={() => { setFlipped(false); onRate('easy'); }} className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-medium shadow">Easy</button>
        </div>
      )}
      <p className="text-xs text-gray-400">Bấm vào thẻ hoặc nhấn Space để lật</p>
    </div>
  );
}
