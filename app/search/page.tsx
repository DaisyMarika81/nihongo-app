'use client';

import { useState } from 'react';
import { vocabLessons1to10 } from '@/data/vocabulary/lessons-1-10';
import { vocabLessons11to25 } from '@/data/vocabulary/lessons-11-25';
import { vocabLessons26to40 } from '@/data/vocabulary/lessons-26-40';
import { vocabLessons41to50 } from '@/data/vocabulary/lessons-41-50';
import { speak } from '@/lib/speak';

const allVocab = [...vocabLessons1to10, ...vocabLessons11to25, ...vocabLessons26to40, ...vocabLessons41to50];

export default function SearchPage() {
  const [query, setQuery] = useState('');

  const results = query.length < 1 ? [] : allVocab.filter((v) => {
    const q = query.toLowerCase();
    return v.japanese.includes(q) || v.reading.includes(q) || v.meaning.toLowerCase().includes(q);
  }).slice(0, 50);

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">🔍 Tìm từ vựng</h1>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nhập kanji, hiragana, hoặc tiếng Việt..."
        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 mb-4"
        autoFocus
      />

      {query && <p className="text-xs text-gray-400 mb-3">{results.length} kết quả</p>}

      <div className="space-y-2">
        {results.map((v, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => speak(v.japanese)} className="text-lg hover:scale-125 transition-transform">🔊</button>
              <div>
                <ruby className="text-lg font-bold text-gray-800">
                  {v.japanese}<rp>(</rp><rt className="text-xs text-indigo-400 font-normal">{v.reading}</rt><rp>)</rp>
                </ruby>
                <div className="text-sm text-gray-500">{v.meaning}</div>
              </div>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Bài {v.lesson}</span>
          </div>
        ))}
      </div>

      {query && results.length === 0 && (
        <p className="text-center text-gray-400 py-8">Không tìm thấy từ nào</p>
      )}
    </div>
  );
}
