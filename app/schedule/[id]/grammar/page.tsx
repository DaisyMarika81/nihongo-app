'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { sessionGrammar, SessionGrammar } from '@/data/session-grammar';
import { speak } from '@/lib/speak';
import { getSessionData, deleteSessionItem } from '@/lib/session-data';
import { supabase } from '@/lib/supabase';

export default function SessionGrammarPage() {
  const { id } = useParams();
  const sessionId = parseInt(id as string);
  const baseItems = sessionGrammar[sessionId] || [];
  const [items, setItems] = useState<SessionGrammar[]>(baseItems);
  const [customItems, setCustomItems] = useState<SessionGrammar[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<SessionGrammar>>({});

  useEffect(() => {
    getSessionData(sessionId, 'grammar').then(data => {
      const mapped = (data as SessionGrammar[]).map((g, i) => ({
        ...g,
        id: g.id || `cloud-${sessionId}-${i}`,
        exampleRomaji: g.exampleRomaji || '',
      }));
      setCustomItems(mapped);
    });
  }, [sessionId]);

  const allItems = [...items, ...customItems];

  async function handleDelete(index: number) {
    if (!confirm('Xóa cấu trúc này?')) return;
    const baseLen = items.length;
    if (index < baseLen) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      const cloudIdx = index - baseLen;
      await deleteSessionItem(sessionId, 'grammar', cloudIdx);
      setCustomItems(customItems.filter((_, i) => i !== cloudIdx));
    }
  }

  function startEdit(index: number) {
    setEditIdx(index);
    setEditData({ ...allItems[index] });
  }

  async function saveEdit() {
    if (editIdx === null) return;
    const baseLen = items.length;
    if (editIdx < baseLen) {
      // Static data — can't save to Supabase, just update locally
      setItems(items.map((item, i) => i === editIdx ? { ...item, ...editData } as SessionGrammar : item));
    } else {
      // Cloud data — update in Supabase
      const cloudIdx = editIdx - baseLen;
      const updated = customItems.map((item, i) => i === cloudIdx ? { ...item, ...editData } as SessionGrammar : item);
      setCustomItems(updated);
      // Save full array back
      await supabase
        .from('session_data')
        .update({ items: updated, updated_at: new Date().toISOString() })
        .eq('session_num', sessionId)
        .eq('type', 'grammar');
    }
    setEditIdx(null);
  }

  if (!allItems.length) {
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
      <p className="text-sm text-gray-500 mb-4">{allItems.length} cấu trúc</p>
      <div className="flex gap-2 mb-6">
        <button onClick={() => { const json = JSON.stringify(allItems, null, 2); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `grammar-buoi-${sessionId}.json`; a.click(); URL.revokeObjectURL(url); }} className="px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl text-xs font-medium shadow">📤 Export JSON</button>
        <button onClick={async () => { if (!confirm(`Xóa tất cả ngữ pháp buổi ${sessionId}?`)) return; await supabase.from('session_data').delete().eq('session_num', sessionId).eq('type', 'grammar'); setItems([]); setCustomItems([]); }} className="px-3 py-1.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl text-xs font-medium shadow">🗑️ Xóa tất cả</button>
      </div>

      <div className="space-y-4">
        {allItems.map((g, i) => (
          <div key={g.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
            <div className="absolute top-3 right-3 flex gap-1">
              <button onClick={() => startEdit(i)} className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">✏️</button>
              <button onClick={() => handleDelete(i)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">🗑️</button>
            </div>

            {editIdx === i ? (
              <div className="space-y-2">
                <input value={editData.pattern || ''} onChange={e => setEditData({ ...editData, pattern: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder="Pattern" />
                <input value={editData.meaning || ''} onChange={e => setEditData({ ...editData, meaning: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Meaning" />
                <input value={editData.example || ''} onChange={e => setEditData({ ...editData, example: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Example" />
                <input value={editData.exampleMeaning || ''} onChange={e => setEditData({ ...editData, exampleMeaning: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Example meaning" />
                <input value={editData.note || ''} onChange={e => setEditData({ ...editData, note: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Note (optional)" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg">💾 Lưu</button>
                  <button onClick={() => setEditIdx(null)} className="text-xs px-3 py-1.5 bg-gray-200 rounded-lg">Hủy</button>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
