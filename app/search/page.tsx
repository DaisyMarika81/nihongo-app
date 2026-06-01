'use client';

import { useState } from 'react';
import { vocabLessons1to10 } from '@/data/vocabulary/lessons-1-10';
import { vocabLessons11to25 } from '@/data/vocabulary/lessons-11-25';
import { vocabLessons26to40 } from '@/data/vocabulary/lessons-26-40';
import { vocabLessons41to50 } from '@/data/vocabulary/lessons-41-50';
import { sessionGrammar } from '@/data/session-grammar';
import { speak } from '@/lib/speak';

const allVocab = [...vocabLessons1to10, ...vocabLessons11to25, ...vocabLessons26to40, ...vocabLessons41to50];
const allGrammar = Object.entries(sessionGrammar).flatMap(([session, items]) =>
  items.map(g => ({ ...g, session: parseInt(session) }))
);

type Tab = 'vocab' | 'grammar';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('vocab');

  const vocabResults = query.length < 1 ? [] : allVocab.filter((v) => {
    const q = query.toLowerCase();
    return v.japanese.includes(q) || v.reading.includes(q) || v.meaning.toLowerCase().includes(q);
  }).slice(0, 50);

  const grammarResults = query.length < 1 ? [] : allGrammar.filter((g) => {
    const q = query.toLowerCase();
    return g.pattern.toLowerCase().includes(q) || g.meaning.toLowerCase().includes(q) || g.example.includes(q);
  }).slice(0, 30);

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">🔍 Tìm kiếm</h1>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nhập kanji, hiragana, tiếng Việt, hoặc pattern ngữ pháp..."
        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 mb-4"
        autoFocus
      />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('vocab')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium ${tab === 'vocab' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          🃏 Từ vựng {query && `(${vocabResults.length})`}
        </button>
        <button onClick={() => setTab('grammar')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium ${tab === 'grammar' ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          📐 Ngữ pháp {query && `(${grammarResults.length})`}
        </button>
      </div>

      {tab === 'vocab' && (
        <div className="space-y-2">
          {vocabResults.map((v, i) => (
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
          {query && vocabResults.length === 0 && <p className="text-center text-gray-400 py-8">Không tìm thấy từ nào</p>}
        </div>
      )}

      {tab === 'grammar' && (
        <div className="space-y-3">
          {grammarResults.map((g) => (
            <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-base font-bold text-indigo-600 font-mono">{g.pattern}</div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Buổi {g.session}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">{g.meaning}</div>
              <div className="mt-2 bg-gray-50 rounded-xl p-2 border border-gray-100">
                <div className="flex items-center gap-2">
                  <button onClick={() => speak(g.example)} className="text-sm">🔊</button>
                  <span className="text-xs text-gray-700">{g.example}</span>
                </div>
                <div className="text-xs text-emerald-600 mt-1">{g.exampleMeaning}</div>
              </div>
            </div>
          ))}
          {query && grammarResults.length === 0 && <p className="text-center text-gray-400 py-8">Không tìm thấy cấu trúc nào</p>}
        </div>
      )}
    </div>
  );
}
