'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { sessionCards } from '@/data/session-cards';
import { sessionGrammar, SessionGrammar, getExampleText, getExampleMeaning } from '@/data/session-grammar';
import { sessionKanji } from '@/data/session-kanji';
import { getSessionData } from '@/lib/session-data';

export default function ExportPage() {
  return <Suspense><ExportContent /></Suspense>;
}

function ExportContent() {
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('session') || '1');
  const [tab, setTab] = useState<'flashcard' | 'grammar' | 'kanji'>('flashcard');
  const [cloudFC, setCloudFC] = useState<{ japanese: string; vietnamese: string }[]>([]);
  const [cloudGR, setCloudGR] = useState<SessionGrammar[]>([]);
  const [cloudKJ, setCloudKJ] = useState<{ kanji: string; hanViet: string; meaning: string }[]>([]);

  useEffect(() => {
    getSessionData(sessionId, 'flashcard').then(d => setCloudFC(d as typeof cloudFC));
    getSessionData(sessionId, 'grammar').then(d => setCloudGR(d as typeof cloudGR));
    getSessionData(sessionId, 'kanji').then(d => setCloudKJ(d as typeof cloudKJ));
  }, [sessionId]);

  const allFC = [...(sessionCards[sessionId] || []), ...cloudFC];
  const allGR = [...(sessionGrammar[sessionId] || []), ...cloudGR];
  const allKJ = [...(sessionKanji[sessionId] || []), ...cloudKJ];

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">📋 Export Buổi {sessionId}</h1>
        <div className="flex gap-2 mb-4">
          {(['flashcard', 'grammar', 'kanji'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium ${tab === t ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {t === 'flashcard' ? `🃏 Từ vựng (${allFC.length})` : t === 'grammar' ? `📐 Ngữ pháp (${allGR.length})` : `🈁 Kanji (${allKJ.length})`}
            </button>
          ))}
        </div>
        <button onClick={handlePrint} className="mb-4 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium shadow">
          🖨️ In / Lưu PDF
        </button>
      </div>

      {/* Printable content */}
      <div className="print-content">
        <h2 className="text-lg font-bold mb-3 print:text-xl">Buổi {sessionId} — {tab === 'flashcard' ? 'Từ vựng' : tab === 'grammar' ? 'Ngữ pháp' : 'Kanji'}</h2>

        {tab === 'flashcard' && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2">#</th>
                <th className="text-left py-2 px-2">Tiếng Nhật</th>
                <th className="text-left py-2 px-2">Nghĩa</th>
              </tr>
            </thead>
            <tbody>
              {allFC.map((c, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1.5 px-2 text-gray-400">{i + 1}</td>
                  <td className="py-1.5 px-2 font-bold">{c.japanese}</td>
                  <td className="py-1.5 px-2 text-gray-600">{c.vietnamese}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'grammar' && (
          <div className="space-y-3">
            {allGR.map((g, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="font-bold text-indigo-700">{i + 1}. {g.pattern}</div>
                <div className="text-sm text-gray-600">{g.meaning}</div>
                <div className="text-xs text-gray-500 mt-1 italic">例: {getExampleText(g.example)}</div>
                <div className="text-xs text-emerald-600">{getExampleMeaning(g.example, g.exampleMeaning)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'kanji' && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2">Kanji</th>
                <th className="text-left py-2 px-2">Hán Việt</th>
                <th className="text-left py-2 px-2">Nghĩa</th>
              </tr>
            </thead>
            <tbody>
              {allKJ.map((k, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1.5 px-2 text-2xl font-bold">{k.kanji}</td>
                  <td className="py-1.5 px-2 text-indigo-600 font-medium">{k.hanViet}</td>
                  <td className="py-1.5 px-2 text-gray-600">{k.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-content { padding: 0; }
          body { font-size: 12pt; }
        }
      `}</style>
    </div>
  );
}
