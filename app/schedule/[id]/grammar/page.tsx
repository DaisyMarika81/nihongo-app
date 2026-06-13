'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { sessionGrammar, SessionGrammar, getExampleText, getExampleRomaji, getExampleMeaning } from '@/data/session-grammar';
import { speak } from '@/lib/speak';
import { getSessionData, deleteSessionItem } from '@/lib/session-data';
import { supabase } from '@/lib/supabase';
import GrammarConnection from '@/app/components/GrammarConnection';

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function getPatternKeywords(pattern: string): string[] {
  const cleaned = pattern.replace(/^.*～/, '');
  const parts = cleaned.split('…').filter(p => p.trim().length >= 2);
  return parts.length ? parts.map(p => p.trim()) : [];
}

function highlightExample(text: string, pattern: string): string {
  const keywords = getPatternKeywords(pattern);
  if (!keywords.length) return text;
  let result = text;
  for (const kw of keywords) {
    result = result.replace(new RegExp(`(${escapeRegex(kw)})`, 'g'), '<span style="color:#7C3AED;background:#F3E8FF;padding:2px 4px;border-radius:4px;font-weight:600">$1</span>');
  }
  return result;
}

function AdminMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute top-4 right-4">
      <button onClick={() => setOpen(!open)} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        <span className="text-sm font-bold">⋯</span>
      </button>
      {open && <>
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
        <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[120px]">
          <button onClick={() => { onEdit(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">✏️ Sửa</button>
          <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">🗑️ Xóa</button>
        </div>
      </>}
    </div>
  );
}

export default function SessionGrammarPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
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
      {isAdmin && <div className="flex gap-2 mb-6">
        <button onClick={() => { const json = JSON.stringify(allItems, null, 2); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `grammar-buoi-${sessionId}.json`; a.click(); URL.revokeObjectURL(url); }} className="px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl text-xs font-medium shadow">📤 Export JSON</button>
        <button onClick={async () => { if (!confirm(`Xóa tất cả ngữ pháp buổi ${sessionId}?`)) return; await supabase.from('session_data').delete().eq('session_num', sessionId).eq('type', 'grammar'); setItems([]); setCustomItems([]); }} className="px-3 py-1.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl text-xs font-medium shadow">🗑️ Xóa tất cả</button>
      </div>}

      <div className="space-y-4">
        {allItems.map((g, i) => (
          <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
            {isAdmin && <AdminMenu onEdit={() => startEdit(i)} onDelete={() => handleDelete(i)} />}

            {editIdx === i ? (
              <div className="space-y-2">
                <input value={editData.pattern || ''} onChange={e => setEditData({ ...editData, pattern: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono" placeholder="Pattern" />
                <input value={editData.meaning || ''} onChange={e => setEditData({ ...editData, meaning: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Meaning" />
                <input value={typeof editData.example === 'string' ? (editData.example || '') : (editData.example?.japanese || '')} onChange={e => setEditData({ ...editData, example: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Example (Japanese)" />
                <input value={editData.exampleMeaning || (typeof editData.example !== 'string' ? editData.example?.vietnamese || '' : '')} onChange={e => setEditData({ ...editData, exampleMeaning: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Example meaning" />
                <input value={editData.note || ''} onChange={e => setEditData({ ...editData, note: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Note (optional)" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg">💾 Lưu</button>
                  <button onClick={() => setEditIdx(null)} className="text-xs px-3 py-1.5 bg-gray-200 rounded-lg">Hủy</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Level tag */}
                {g.jlpt && (
                  <span className="inline-block text-[11px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{g.jlpt}</span>
                )}

                {/* Formula block */}
                {g.connections && g.connections.length > 0 ? (
                  <GrammarConnection connections={g.connections} pattern={g.pattern} index={i + 1} />
                ) : (
                  <div className="text-lg font-bold text-indigo-600 font-mono">{g.pattern}</div>
                )}

                {/* Meaning */}
                <div className="text-sm mb-5" style={{ color: '#333' }}>{g.meaning}</div>

                {/* Details — each section as its own card */}
                {g.details && <div className="space-y-3">
                  {[
                    { key: 'nature' as const, icon: '💡', label: 'BẢN CHẤT' },
                    { key: 'nuance' as const, icon: '🎭', label: 'Sắc thái' },
                    { key: 'exception' as const, icon: '⚠️', label: 'Ngoại lệ' },
                    { key: 'syntax_note' as const, icon: '🔧', label: 'Cấu trúc' },
                    { key: 'distinction' as const, icon: '🔍', label: 'Phân biệt' },
                    { key: 'variant_distinction' as const, icon: '🔀', label: 'Phân biệt' },
                  ].map(({ key, icon, label }) => {
                    const val = g.details![key];
                    if (!val || (typeof val === 'string' && !val.trim())) return null;
                    return (
                      <div key={key} style={{ background: '#FFF7ED', borderLeft: '4px solid #F59E0B' }} className="rounded-r-xl px-4 py-3">
                        <div className="text-sm font-bold" style={{ color: '#333' }}>{icon} {label}</div>
                        <div className="text-sm mt-1" style={{ color: '#333' }}>{val}</div>
                      </div>
                    );
                  })}
                  {g.details.cases && g.details.cases.length > 0 && (
                    <div style={{ background: '#FFF7ED', borderLeft: '4px solid #F59E0B' }} className="rounded-r-xl px-4 py-3">
                      <div className="text-sm font-bold" style={{ color: '#333' }}>📋 Phân loại</div>
                      <ul className="space-y-1 mt-1">
                        {g.details.cases.map((item, j) => (
                          <li key={j} className="flex gap-2" style={{ color: '#333' }}>
                            <span className="text-amber-600 shrink-0 font-bold text-sm">{j + 1}.</span>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {g.details.tense_distinction && g.details.tense_distinction.length > 0 && (
                    <div style={{ background: '#FFF7ED', borderLeft: '4px solid #F59E0B' }} className="rounded-r-xl px-4 py-3">
                      <div className="text-sm font-bold" style={{ color: '#333' }}>⏳ Phân biệt thì</div>
                      <ul className="space-y-1 mt-1">
                        {g.details.tense_distinction.map((item, j) => (
                          <li key={j} className="flex gap-2" style={{ color: '#333' }}>
                            <span className="text-amber-600 shrink-0 font-bold text-sm">{j + 1}.</span>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>}

                {/* Legacy note */}
                {g.note && <div style={{ background: '#FFF7ED', borderLeft: '4px solid #F59E0B' }} className="rounded-r-xl px-4 py-3 space-y-3">
                  {g.note.split(/(?=\[)/).filter(Boolean).map((section, idx) => {
                    const match = section.match(/^\[(.+?)\][：:]?\s*([\s\S]*)/);
                    if (match) {
                      const content = match[2].trim();
                      const numbered = content.split(/(?=\d+[\.\、]\s*)/).filter(s => s.trim());
                      if (numbered.length > 1) {
                        return (
                          <div key={idx}>
                            <div className="text-sm font-bold" style={{ color: '#333' }}>{match[1]}:</div>
                            <ul className="space-y-1 mt-1">
                              {numbered.map((item, j) => (
                                <li key={j} className="flex gap-2">
                                  <span className="text-amber-600 shrink-0 font-bold text-sm">{j + 1}.</span>
                                  <span className="text-sm" style={{ color: '#333' }}>{item.replace(/^\d+[\.\、]\s*/, '')}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="text-sm" style={{ color: '#333' }}>
                          <span className="font-bold">{match[1]}:</span>{' '}
                          <span>{content}</span>
                        </div>
                      );
                    }
                    return <div key={idx} className="text-sm" style={{ color: '#333' }}>💡 {section}</div>;
                  })}
                </div>}

                {/* Example with grammar highlight */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                  <div className="flex items-start gap-2">
                    <button onClick={() => speak(getExampleText(g.example))} className="text-sm mt-0.5 shrink-0">🔊</button>
                    <span
                      className="text-lg font-semibold leading-relaxed"
                      style={{ color: '#333' }}
                      dangerouslySetInnerHTML={{ __html: highlightExample(getExampleText(g.example), g.pattern) }}
                    />
                  </div>
                  <div className="text-sm italic" style={{ color: '#666' }}>{getExampleRomaji(g.example, g.exampleRomaji)}</div>
                  <div className="text-[15px]" style={{ color: '#555' }}>{getExampleMeaning(g.example, g.exampleMeaning)}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
