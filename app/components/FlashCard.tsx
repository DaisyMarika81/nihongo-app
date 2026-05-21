'use client';

import { useState } from 'react';
import { ReviewResult } from '@/lib/srs';
import { speak } from '@/lib/speak';

interface FlashCardProps {
  front: string;
  reading: string;
  meaning: string;
  onRate: (rating: ReviewResult) => void;
}

export default function FlashCard({ front, reading, meaning, onRate }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-72 sm:w-80 h-48 cursor-pointer [perspective:1000px]" onClick={() => setFlipped(!flipped)}>
        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-xl [backface-visibility:hidden]">
            <span className="text-4xl font-bold" style={{ color: '#fff' }}>{front}</span>
            <button onClick={(e) => { e.stopPropagation(); speak(front); }} className="mt-3 text-xl opacity-80 hover:opacity-100 hover:scale-125 transition-transform" style={{ color: '#fff' }}>🔊</button>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-2xl font-bold" style={{ color: '#fff' }}>{reading}</span>
            <span className="text-lg" style={{ color: '#fff', opacity: 0.9 }}>{meaning}</span>
          </div>
        </div>
      </div>
      {flipped && (
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => { setFlipped(false); onRate('again'); }} className="px-4 py-2 rounded-xl bg-red-400 hover:bg-red-500 text-white font-medium shadow">Again</button>
          <button onClick={() => { setFlipped(false); onRate('hard'); }} className="px-4 py-2 rounded-xl bg-orange-400 hover:bg-orange-500 text-white font-medium shadow">Hard</button>
          <button onClick={() => { setFlipped(false); onRate('good'); }} className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-white font-medium shadow">Good</button>
          <button onClick={() => { setFlipped(false); onRate('easy'); }} className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-medium shadow">Easy</button>
        </div>
      )}
    </div>
  );
}
