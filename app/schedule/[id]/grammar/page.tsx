'use client';

import { useParams } from 'next/navigation';
import { sessionGrammar } from '@/data/session-grammar';
import { speak } from '@/lib/speak';

export default function SessionGrammarPage() {
  const { id } = useParams();
  const sessionId = parseInt(id as string);
  const items = sessionGrammar[sessionId] || [];

  if (!items.length) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <p className="text-4xl mb-4">📭</p>
        <p className="text-lg font-bold text-gray-800">Buổi {sessionId} chưa có ngữ pháp</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-xl font-bold text-gray-800 mb-4">📐 Ngữ pháp Buổi {sessionId}</h1>
      <p className="text-sm text-gray-500 mb-6">{items.length} cấu trúc</p>

      <div className="space-y-4">
        {items.map((g) => (
          <div key={g.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-lg font-bold text-indigo-600 font-mono">{g.pattern}</div>
            <div className="text-sm text-gray-600 mt-1">{g.meaning}</div>
            {g.note && <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-2 inline-block">💡 {g.note}</div>}
            <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2">
                <button onClick={() => speak(g.example)} className="text-sm">🔊</button>
                <span className="text-sm font-medium text-gray-800">{g.example}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 italic">{g.exampleRomaji}</div>
              <div className="text-xs text-emerald-600 mt-1">{g.exampleMeaning}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
