'use client';

import { ChangeEvent, useState } from 'react';
import Link from 'next/link';
import { IMPORT_EXAMPLE, ImportedFlashcardType, loadImportedFlashcards } from '@/lib/imported-flashcards';
import { createSession, FlashcardSession, importCardsIntoSession, loadSessions, removeCardsFromSession } from '@/lib/flashcard-sessions';

export default function ImportFlashcardsPage() {
  const [type, setType] = useState<ImportedFlashcardType>('kanji');
  const [json, setJson] = useState(IMPORT_EXAMPLE);
  const [sessions, setSessions] = useState<FlashcardSession[]>(() => loadSessions());
  const [sessionId, setSessionId] = useState(() => loadSessions()[0]?.id || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function refresh() { const loaded = loadSessions(); setSessions(loaded); if (!loaded.some((item) => item.id === sessionId)) setSessionId(loaded[0]?.id || ''); }

  function addSession() {
    const created = createSession();
    refresh(); setSessionId(created.id); setMessage(`Đã tạo ${created.name}. JSON tiếp theo sẽ được import vào session này.`); setError('');
  }

  function importCards() {
    setError(''); setMessage('');
    try {
      if (!sessionId) throw new Error('Hãy tạo hoặc chọn một session trước.');
      const result = importCardsIntoSession(json, type, sessionId);
      refresh();
      setMessage(`Đã thêm ${result.fresh.length} thẻ vào ${sessions.find((item) => item.id === sessionId)?.name || 'session'}${result.fresh.length !== result.incoming.length ? ` (bỏ qua ${result.incoming.length - result.fresh.length} thẻ trùng)` : ''}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể import JSON.'); }
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setJson(await file.text()); setMessage(`Đã đọc ${file.name}. Bấm “Import vào session” để lưu.`); setError('');
  }

  function clearType() {
    if (!sessionId) return;
    removeCardsFromSession(sessionId, type); refresh(); setMessage(`Đã xoá toàn bộ thẻ ${type === 'kanji' ? 'Kanji' : 'từ vựng'} trong session.`);
  }

  const active = sessions.find((item) => item.id === sessionId);
  const cards = active?.cards || [];
  return (
    <main className="min-h-screen p-4 pb-24 max-w-2xl mx-auto space-y-5">
      <Link href="/n3-flashcard" className="text-sm text-gray-400 hover:text-gray-600">← Quay lại luyện flashcard</Link>
      <div><h1 className="text-2xl font-bold text-gray-800">📥 Import Kanji vào session</h1><p className="text-sm text-gray-500 mt-1">Mỗi session là một bộ flashcard riêng. Bấm dấu <b>+</b> để tạo session mới, sau đó import JSON vào session đang chọn.</p></div>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2"><label htmlFor="session" className="text-sm font-semibold text-gray-700">Session nhận dữ liệu</label><button type="button" onClick={addSession} className="ml-auto rounded-full bg-indigo-100 text-indigo-600 h-9 w-9 text-xl font-semibold hover:bg-indigo-200" aria-label="Tạo session mới">+</button></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{sessions.map((item) => <button key={item.id} type="button" onClick={() => setSessionId(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${item.id === sessionId ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{item.name} ({item.cards.length})</button>)}</div>
      </section>

      <div className="grid grid-cols-2 gap-2">{(['kanji', 'vocabulary'] as ImportedFlashcardType[]).map((value) => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-xl px-4 py-3 font-semibold border ${type === value ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-600 border-gray-200'}`}>{value === 'kanji' ? '🈁 Kanji' : '🃏 Từ vựng'}</button>)}</div>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3"><label className="text-sm font-semibold text-gray-700">Dán JSON hoặc chọn file .json</label><label className="cursor-pointer text-sm px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Chọn file<input type="file" accept="application/json,.json" onChange={readFile} className="hidden" /></label></div>
        <textarea value={json} onChange={(event) => setJson(event.target.value)} rows={12} spellCheck={false} className="w-full rounded-xl border border-gray-200 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" aria-label="JSON flashcard" />
        <div className="flex flex-wrap gap-2"><button type="button" onClick={importCards} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow hover:opacity-90">Import vào session</button><button type="button" onClick={clearType} className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50">Xoá {type === 'kanji' ? 'Kanji' : 'từ vựng'} trong session</button></div>
        {message && <p className="text-sm text-emerald-600" role="status">✅ {message}</p>}{error && <p className="text-sm text-red-600" role="alert">⚠️ {error}</p>}
      </section>

      <section className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900"><p className="font-semibold mb-2">Mẫu JSON</p><pre className="overflow-auto text-xs">{IMPORT_EXAMPLE}</pre><p className="mt-3">Đang xem: <b>{active?.name || 'chưa chọn session'}</b> — {cards.length} thẻ. <Link href="/n3-flashcard" className="font-semibold underline">Mở luyện flashcard</Link></p></section>
      <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2"><h2 className="font-semibold text-gray-700">Thẻ trong {active?.name || 'session'} ({cards.length})</h2>{cards.length === 0 ? <p className="text-sm text-gray-400">Chưa có thẻ nào.</p> : cards.map((card) => <div key={card.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"><span className="text-xl font-bold text-gray-800">{card.kanji}</span><span className="text-sm text-gray-500">{card.hiragana}</span><span className="text-sm text-gray-700 truncate">{card.meaning}</span></div>)}</section>
    </main>
  );
}
