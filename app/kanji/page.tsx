'use client';

import { useState } from 'react';
import { kanjiN5 } from '@/data/kanji';
import { kanjiN4, kanjiN4Part2 } from '@/data/kanji-n4';
import { speak } from '@/lib/speak';

const allKanji = { N5: kanjiN5, N4: [...kanjiN4, ...kanjiN4Part2] };
type Level = 'N5' | 'N4';

export default function KanjiPage() {
  const [level, setLevel] = useState<Level>('N5');
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selected, setSelected] = useState<typeof kanjiN5[0] | null>(null);
  const [search, setSearch] = useState('');

  const data = allKanji[level];
  const lessons = [...new Set(data.map((k) => k.lesson))].sort((a, b) => a - b);
  const filtered = data.filter((k) => {
    if (search) {
      const q = search.toLowerCase();
      return k.character.includes(q) || k.meaning.toLowerCase().includes(q) || k.onyomi.includes(search) || k.kunyomi.includes(search) || k.examples.some((e) => e.reading.includes(q) || e.meaning.toLowerCase().includes(q));
    }
    return selectedLesson ? k.lesson === selectedLesson : true;
  });

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">🈁 Kanji</h1>
      <p className="text-sm text-gray-500 mb-4">{data.length} chữ Hán • {level}</p>

      {/* Level toggle */}
      <div className="flex gap-2 mb-4">
        {(['N5', 'N4'] as Level[]).map((l) => (
          <button key={l} onClick={() => { setLevel(l); setSelectedLesson(null); setSearch(''); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${level === l ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setSelectedLesson(null); }}
        placeholder="Tìm theo nghĩa, romaji, kanji..."
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-rose-300"
      />

      {/* Lesson filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setSelectedLesson(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!selectedLesson ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Tất cả
        </button>
        {lessons.map((l) => (
          <button key={l} onClick={() => setSelectedLesson(l)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedLesson === l ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>
            Bài {l}
          </button>
        ))}
      </div>

      {/* Kanji grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {filtered.map((k) => (
          <button key={k.character + k.lesson} onClick={() => setSelected(k)}
            className="flex flex-col items-center justify-center py-4 px-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:scale-105 transition-all">
            <span className="text-3xl font-bold text-gray-800">{k.character}</span>
            <span className="text-[11px] text-gray-500 mt-1 truncate w-full text-center">{k.meaning}</span>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-7xl font-bold text-gray-800 mb-2">{selected.character}</div>
              <button onClick={() => speak(selected.character)} className="text-2xl hover:scale-125 transition-transform">🔊</button>
              <div className="text-lg font-semibold text-rose-500">{selected.meaning}</div>
              <div className="text-xs text-gray-400 mt-1">{selected.strokes} nét • Bài {selected.lesson}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-sky-50 rounded-xl p-3 text-center">
                <div className="text-xs text-sky-400 font-medium">Onyomi</div>
                <div className="text-sm font-bold text-sky-700 mt-1">{selected.onyomi || '—'}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-xs text-emerald-400 font-medium">Kunyomi</div>
                <div className="text-sm font-bold text-emerald-700 mt-1">{selected.kunyomi || '—'}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs text-gray-400 font-medium mb-2">Ví dụ:</div>
              {selected.examples.map((ex, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-2 mb-1 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-800">{ex.word}</span>
                    <span className="text-xs text-indigo-400 ml-2">{ex.reading}</span>
                  </div>
                  <span className="text-xs text-gray-500">{ex.meaning}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)} className="mt-4 w-full py-2 bg-gray-100 rounded-xl text-sm text-gray-600 font-medium">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
