'use client';

import { useState, useEffect } from 'react';
import { hiragana } from '@/data/hiragana';
import { katakana } from '@/data/katakana';
import type { KanaEntry } from '@/data/hiragana';
import { speak } from '@/lib/speak';

const KANA_STORAGE = 'nihongo_kana_mastered';

export default function KanaPage() {
  const [mode, setMode] = useState<'hiragana' | 'katakana'>('hiragana');
  const [selected, setSelected] = useState<KanaEntry | null>(null);
  const [mastered, setMastered] = useState<Set<string>>(new Set());

  useEffect(() => {
    const raw = localStorage.getItem(KANA_STORAGE);
    if (raw) setMastered(new Set(JSON.parse(raw)));
  }, []);

  const data = mode === 'hiragana' ? hiragana : katakana;
  const groups = [...new Set(data.map((k) => k.group))];
  const progress = Math.round((mastered.size / (hiragana.length + katakana.length)) * 100);

  function toggleMastered(char: string) {
    const next = new Set(mastered);
    next.has(char) ? next.delete(char) : next.add(char);
    setMastered(next);
    localStorage.setItem(KANA_STORAGE, JSON.stringify([...next]));
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">🔤 Bảng chữ Kana</h1>
      <p className="text-sm text-gray-500 mb-4">Tiến độ: <span className="font-medium text-emerald-500">{progress}%</span></p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode('hiragana')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'hiragana' ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Hiragana
        </button>
        <button onClick={() => setMode('katakana')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'katakana' ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Katakana
        </button>
      </div>

      {groups.map((group) => (
        <div key={group} className="mb-4">
          <div className="text-xs text-gray-400 mb-1 uppercase font-medium">{group}</div>
          <div className="grid grid-cols-5 gap-2">
            {data.filter((k) => k.group === group).map((k) => (
              <button key={k.character} onClick={() => setSelected(k)}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl text-lg transition-all shadow-sm
                  ${mastered.has(k.character)
                    ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 ring-2 ring-emerald-300'
                    : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-100'}`}>
                {k.character}
                <span className="text-[10px] text-gray-400">{k.romaji}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-7xl text-gray-800 mb-2">{selected.character}</div>
            <div className="text-xl text-indigo-500 font-bold">{selected.romaji}</div>
            <button onClick={() => speak(selected.character)} className="mt-2 text-2xl hover:scale-125 transition-transform">🔊</button>
            <button onClick={() => { toggleMastered(selected.character); setSelected(null); }}
              className={`mt-6 px-5 py-2 rounded-xl text-sm font-medium shadow ${mastered.has(selected.character) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {mastered.has(selected.character) ? '✕ Bỏ đánh dấu' : '✓ Đã thuộc'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
