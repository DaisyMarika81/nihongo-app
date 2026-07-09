'use client';

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  sessionGrammar,
  SessionGrammar,
  GrammarUsage,
  GrammarExample,
  getExampleText,
  getExampleRomaji,
  getExampleHiragana,
  getExampleMeaning,
} from '@/data/session-grammar';
import Link from 'next/link';
import { speak } from '@/lib/speak';
import { getSessionData, deleteSessionItem, deleteAllSessionData } from '@/lib/session-data';
import { supabase } from '@/lib/supabase';
import GrammarConnection from '@/app/components/GrammarConnection';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Keywords from pattern for highlight (e.g. ～だらけ → だらけ) */
function getPatternKeywords(pattern: string): string[] {
  if (!pattern?.trim()) return [];
  let cleaned = pattern
    .replace(/[～~〜]/g, '')
    .replace(/\s+/g, '')
    .replace(/[＋+]/g, '')
    .replace(/\bN\b/gi, '')
    .replace(/\bV\b/gi, '')
    .replace(/\bA\b/gi, '')
    .replace(/…|\.{2,}/g, '');
  // Keep Japanese + common particles chunks of length ≥ 2
  const jp = cleaned.match(/[\u3040-\u30ff\u4e00-\u9fafー]{2,}/g) || [];
  const unique = [...new Set(jp)];
  // Prefer longer first so we don't partial-overlap badly
  return unique.sort((a, b) => b.length - a.length);
}

function highlightInText(text: string, pattern: string): ReactNode {
  if (!text) return null;
  const keywords = getPatternKeywords(pattern);
  if (!keywords.length) return text;

  // Build single regex of all keywords
  try {
    const re = new RegExp(`(${keywords.map(escapeRegex).join('|')})`, 'g');
    const parts = text.split(re);
    const set = new Set(keywords);
    return parts.map((p, i) =>
      set.has(p) ? (
        <span
          key={i}
          className="text-violet-700 bg-violet-100 px-0.5 rounded font-semibold inline"
        >
          {p}
        </span>
      ) : (
        p
      )
    );
  } catch {
    return text;
  }
}

function BackLink({ sessionId }: { sessionId: number }) {
  return (
    <Link
      href={`/schedule/${sessionId}`}
      className="text-sm text-gray-500 hover:text-indigo-500 transition-colors inline-flex items-center gap-1"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Quay lại
    </Link>
  );
}

function AdminMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute top-4 right-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Menu quản lý"
      >
        <span className="text-sm font-bold">⋯</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[120px]">
            <button
              type="button"
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ✏️ Sửa
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              🗑️ Xóa
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** JP → ひらがな → romaji → nghĩa (mỗi lớp tối đa 1) */
function ExampleBlock({
  japanese,
  pattern,
  hiragana,
  romaji,
  meaning,
}: {
  japanese: string;
  pattern: string;
  hiragana?: string;
  romaji?: string;
  meaning?: string;
}) {
  if (!japanese?.trim()) return null;
  const hira = (hiragana || '').trim();
  const roma = (romaji || '').trim();
  const mean = (meaning || '').trim();

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => speak(japanese)}
          className="text-sm mt-0.5 shrink-0 hover:opacity-70"
          aria-label="Phát âm"
        >
          🔊
        </button>
        <span className="text-base font-semibold leading-relaxed break-words text-gray-800">
          {highlightInText(japanese, pattern)}
        </span>
      </div>
      {hira && hira !== japanese && <div className="text-sm text-gray-500 pl-7">{hira}</div>}
      {roma && roma !== hira && <div className="text-sm italic text-gray-500 pl-7">{roma}</div>}
      {mean && <div className="text-[15px] text-gray-600 pl-7">{mean}</div>}
    </div>
  );
}

function DetailCard({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="rounded-r-xl px-4 py-3 bg-orange-50 border-l-4 border-amber-500">
      <div className="text-sm font-bold text-gray-800">
        {icon} {label}
      </div>
      <div className="text-sm break-words mt-1 text-gray-700">{children}</div>
    </div>
  );
}

function normalizeGrammar(g: SessionGrammar, sessionId: number, i: number): SessionGrammar {
  return {
    ...g,
    id: g.id || `g-${sessionId}-${i}`,
    pattern: g.pattern || '',
    meaning: g.meaning || '',
    example: g.example ?? '',
    usages: g.usages || [],
    connections: g.connections || [],
  };
}

export default function SessionGrammarPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const rawId = parseInt(String(id), 10);
  const sessionId = Number.isFinite(rawId) && rawId >= 1 ? rawId : 0;

  const baseItems = useMemo(
    () =>
      sessionId
        ? (sessionGrammar[sessionId] || []).map((g, i) => normalizeGrammar(g, sessionId, i))
        : [],
    [sessionId]
  );

  const [items, setItems] = useState<SessionGrammar[]>([]);
  const [customItems, setCustomItems] = useState<SessionGrammar[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveHint, setSaveHint] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<SessionGrammar>>({});
  const [editJson, setEditJson] = useState(false);
  const [editJsonText, setEditJsonText] = useState('');
  const [editJsonError, setEditJsonError] = useState('');

  const load = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      // Local overrides for base (static) grammar
      const overrideKey = `grammar_override_${sessionId}`;
      const deletedKey = `grammar_deleted_base_${sessionId}`;
      let overrides: Record<string, SessionGrammar> = {};
      let deleted: string[] = [];
      try {
        overrides = JSON.parse(localStorage.getItem(overrideKey) || '{}');
        deleted = JSON.parse(localStorage.getItem(deletedKey) || '[]');
      } catch {
        /* ignore */
      }
      const delSet = new Set(deleted);

      const base = baseItems
        .filter((g) => !delSet.has(g.id))
        .map((g) => (overrides[g.id] ? { ...g, ...overrides[g.id], id: g.id } : g));

      setItems(base);

      const data = (await getSessionData(sessionId, 'grammar')) as SessionGrammar[];
      const mapped = (Array.isArray(data) ? data : []).map((g, i) =>
        normalizeGrammar(g, sessionId, 1000 + i)
      );
      setCustomItems(mapped);
    } catch {
      setLoadError('Không tải được ngữ pháp cloud. Đang hiện dữ liệu local.');
      setItems(baseItems);
      setCustomItems([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, baseItems]);

  useEffect(() => {
    load();
  }, [load]);

  const allItems = useMemo(() => [...items, ...customItems], [items, customItems]);
  const baseLen = items.length;

  if (!sessionId) {
    notFound();
  }

  function flashHint(msg: string) {
    setSaveHint(msg);
    setTimeout(() => setSaveHint(''), 2800);
  }

  function saveBaseOverride(item: SessionGrammar) {
    const key = `grammar_override_${sessionId}`;
    try {
      const map = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, SessionGrammar>;
      map[item.id] = item;
      localStorage.setItem(key, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }

  async function persistCloud(updated: SessionGrammar[]) {
    if (updated.length === 0) {
      await deleteAllSessionData(sessionId, 'grammar').catch(() => {});
      return;
    }
    await supabase.from('session_data').upsert(
      {
        session_num: sessionId,
        type: 'grammar',
        items: updated,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_num,type' }
    );
  }

  async function handleDelete(index: number) {
    if (!isAdmin) return;
    if (!confirm('Xóa cấu trúc này?')) return;
    if (index < baseLen) {
      const removed = items[index];
      setItems(items.filter((_, i) => i !== index));
      try {
        const key = `grammar_deleted_base_${sessionId}`;
        const list = JSON.parse(localStorage.getItem(key) || '[]') as string[];
        if (removed?.id && !list.includes(removed.id)) {
          list.push(removed.id);
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch {
        /* ignore */
      }
      flashHint('Đã ẩn mục base (local).');
    } else {
      const cloudIdx = index - baseLen;
      await deleteSessionItem(sessionId, 'grammar', cloudIdx).catch(() => {});
      setCustomItems(customItems.filter((_, i) => i !== cloudIdx));
      flashHint('Đã xóa mục cloud.');
    }
  }

  function startEdit(index: number) {
    if (!isAdmin) return;
    setEditIdx(index);
    setEditData({ ...allItems[index] });
  }

  async function saveEdit() {
    if (!isAdmin || editIdx === null) return;
    if (editIdx < baseLen) {
      const next = items.map((item, i) =>
        i === editIdx ? ({ ...item, ...editData } as SessionGrammar) : item
      );
      setItems(next);
      saveBaseOverride(next[editIdx]);
      flashHint('Đã lưu base vào máy (local). Không ghi cloud.');
    } else {
      const cloudIdx = editIdx - baseLen;
      const updated = customItems.map((item, i) =>
        i === cloudIdx ? ({ ...item, ...editData } as SessionGrammar) : item
      );
      setCustomItems(updated);
      await persistCloud(updated).catch(() => flashHint('Lỗi lưu cloud.'));
      flashHint('Đã lưu cloud.');
    }
    setEditIdx(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-400">Đang tải ngữ pháp buổi {sessionId}…</p>
      </div>
    );
  }

  if (!allItems.length) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <div className="self-start mb-4">
          <BackLink sessionId={sessionId} />
        </div>
        <p className="text-4xl mb-4">📭</p>
        <p className="text-lg font-bold text-gray-800">Buổi {sessionId} chưa có ngữ pháp</p>
        {loadError && <p className="text-xs text-amber-600 mt-2">{loadError}</p>}
        {isAdmin && (
          <a
            href={`/upload?session=${sessionId}`}
            className="mt-4 px-6 py-3 text-white rounded-xl font-medium shadow"
            style={{ background: '#6C63FF' }}
          >
            ➕ Thêm ngữ pháp
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 max-w-2xl mx-auto">
      <BackLink sessionId={sessionId} />
      <h1 className="text-xl font-bold text-gray-800 mb-1 mt-2">📐 Ngữ pháp Buổi {sessionId}</h1>
      <p className="text-sm text-gray-500 mb-3">
        {allItems.length} cấu trúc
        {baseLen > 0 && customItems.length > 0 && (
          <span className="text-gray-400">
            {' '}
            · {baseLen} base + {customItems.length} cloud
          </span>
        )}
      </p>
      {loadError && (
        <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          ⚠ {loadError}
        </p>
      )}
      {saveHint && (
        <p className="mb-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {saveHint}
        </p>
      )}

      {isAdmin && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const json = JSON.stringify(allItems, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `grammar-buoi-${sessionId}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl text-xs font-medium shadow"
          >
            📤 Export JSON
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`Xóa ngữ pháp cloud buổi ${sessionId}? (Base local vẫn giữ)`)) return;
              await deleteAllSessionData(sessionId, 'grammar').catch(() => {});
              setCustomItems([]);
              flashHint('Đã xóa cloud. Base vẫn còn.');
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl text-xs font-medium shadow"
          >
            🗑️ Xóa cloud
          </button>
          <button
            type="button"
            onClick={() => {
              setEditJson(!editJson);
              if (!editJson) {
                setEditJsonText(JSON.stringify(allItems, null, 2));
                setEditJsonError('');
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shadow ${
              editJson ? 'bg-indigo-500 text-white' : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
            }`}
          >
            📝 Edit JSON
          </button>
          <a
            href={`/upload?session=${sessionId}`}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl text-xs font-medium shadow"
          >
            ➕ Thêm
          </a>
        </div>
      )}

      {editJson && isAdmin && (
        <div className="mb-6 space-y-2">
          <textarea
            value={editJsonText}
            onChange={(e) => setEditJsonText(e.target.value)}
            className="w-full h-64 p-3 font-mono text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
            spellCheck={false}
          />
          {editJsonError && <p className="text-red-500 text-xs">⚠ {editJsonError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const parsed = JSON.parse(editJsonText);
                  if (!Array.isArray(parsed)) throw new Error('Phải là một mảng');
                  const normalized = parsed.map((g: SessionGrammar, i: number) =>
                    normalizeGrammar(g, sessionId, i)
                  );
                  // Keep first baseLen as base overrides; rest cloud
                  const newBase = normalized.slice(0, baseLen);
                  const newCustom = normalized.slice(baseLen);
                  setItems(newBase);
                  newBase.forEach(saveBaseOverride);
                  setCustomItems(newCustom);
                  await persistCloud(newCustom);
                  setEditJson(false);
                  flashHint('Đã lưu JSON (base→local, phần còn lại→cloud).');
                } catch (e: unknown) {
                  setEditJsonError(e instanceof Error ? e.message : 'JSON không hợp lệ');
                }
              }}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium shadow hover:bg-emerald-600"
            >
              💾 Lưu
            </button>
            <button
              type="button"
              onClick={() => setEditJson(false)}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {allItems.map((g, i) => (
          <div key={g.id || `item-${i}`} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
            {isAdmin && <AdminMenu onEdit={() => startEdit(i)} onDelete={() => handleDelete(i)} />}

            {editIdx === i ? (
              <div className="space-y-2">
                {i < baseLen && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Mục base — lưu trên máy, không ghi Supabase.
                  </p>
                )}
                <input
                  value={editData.pattern || ''}
                  onChange={(e) => setEditData({ ...editData, pattern: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  placeholder="Pattern"
                />
                <input
                  value={editData.meaning || ''}
                  onChange={(e) => setEditData({ ...editData, meaning: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Meaning"
                />
                <input
                  value={
                    typeof editData.example === 'string'
                      ? editData.example || ''
                      : editData.example?.japanese || ''
                  }
                  onChange={(e) => setEditData({ ...editData, example: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Example (Japanese)"
                />
                <input
                  value={
                    editData.exampleMeaning ||
                    (typeof editData.example !== 'string' ? editData.example?.vietnamese || '' : '')
                  }
                  onChange={(e) => setEditData({ ...editData, exampleMeaning: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Example meaning"
                />
                <input
                  value={editData.note || ''}
                  onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Note (optional)"
                />
                <details className="border border-gray-200 rounded-lg">
                  <summary className="px-3 py-2 text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-50 rounded-lg">
                    📋 Cách dùng ({((editData.usages || []) as GrammarUsage[]).length})
                  </summary>
                  <div className="p-3 space-y-3 border-t border-gray-200">
                    {(editData.usages || []).map((u, ui) => (
                      <div key={ui} className="space-y-1.5 p-2 bg-gray-50 rounded-lg relative">
                        <button
                          type="button"
                          onClick={() => {
                            const arr = [...(editData.usages || [])];
                            arr.splice(ui, 1);
                            setEditData({ ...editData, usages: arr });
                          }}
                          className="absolute top-1 right-1 text-[10px] text-red-400 hover:text-red-600"
                          aria-label="Xóa cách dùng"
                        >
                          ✕
                        </button>
                        <input
                          value={u.label}
                          onChange={(e) => {
                            const arr = [...(editData.usages || [])];
                            arr[ui] = { ...arr[ui], label: e.target.value };
                            setEditData({ ...editData, usages: arr });
                          }}
                          className="w-full px-2 py-1 border rounded text-xs font-medium"
                          placeholder="Label"
                        />
                        <input
                          value={u.meaning}
                          onChange={(e) => {
                            const arr = [...(editData.usages || [])];
                            arr[ui] = { ...arr[ui], meaning: e.target.value };
                            setEditData({ ...editData, usages: arr });
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                          placeholder="Meaning"
                        />
                        <input
                          value={u.pattern || ''}
                          onChange={(e) => {
                            const arr = [...(editData.usages || [])];
                            arr[ui] = { ...arr[ui], pattern: e.target.value };
                            setEditData({ ...editData, usages: arr });
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                          placeholder="Pattern riêng"
                        />
                        <input
                          value={typeof u.example === 'string' ? u.example || '' : u.example?.japanese || ''}
                          onChange={(e) => {
                            const arr = [...(editData.usages || [])];
                            arr[ui] = { ...arr[ui], example: e.target.value };
                            setEditData({ ...editData, usages: arr });
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                          placeholder="Example (Japanese)"
                        />
                        <input
                          value={
                            u.exampleMeaning ||
                            (typeof u.example !== 'string' && u.example?.vietnamese
                              ? u.example.vietnamese
                              : '')
                          }
                          onChange={(e) => {
                            const arr = [...(editData.usages || [])];
                            arr[ui] = { ...arr[ui], exampleMeaning: e.target.value };
                            setEditData({ ...editData, usages: arr });
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                          placeholder="Example meaning"
                        />
                        <input
                          value={u.note || ''}
                          onChange={(e) => {
                            const arr = [...(editData.usages || [])];
                            arr[ui] = { ...arr[ui], note: e.target.value };
                            setEditData({ ...editData, usages: arr });
                          }}
                          className="w-full px-2 py-1 border rounded text-xs"
                          placeholder="Ghi chú"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setEditData({
                          ...editData,
                          usages: [...(editData.usages || []), { label: '', meaning: '' }],
                        })
                      }
                      className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                    >
                      + Thêm cách dùng
                    </button>
                  </div>
                </details>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg"
                  >
                    💾 Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIdx(null)}
                    className="text-xs px-3 py-1.5 bg-gray-200 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {g.jlpt && (
                  <span className="inline-block text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                    {g.jlpt}
                  </span>
                )}

                {g.connections && g.connections.length > 0 ? (
                  <GrammarConnection connections={g.connections} pattern={g.pattern} index={i + 1} />
                ) : (
                  <div className="text-lg font-bold text-indigo-600 font-mono break-words">{g.pattern}</div>
                )}

                <div className="text-sm text-gray-800">{g.meaning}</div>

                {g.details && (
                  <div className="space-y-3">
                    {(
                      [
                        { key: 'nature' as const, icon: '💡', label: 'BẢN CHẤT' },
                        { key: 'nuance' as const, icon: '🎭', label: 'Sắc thái' },
                        { key: 'exception' as const, icon: '⚠️', label: 'Ngoại lệ' },
                        { key: 'syntax_note' as const, icon: '🔧', label: 'Cấu trúc' },
                        { key: 'distinction' as const, icon: '🔍', label: 'Phân biệt' },
                        { key: 'variant_distinction' as const, icon: '🔀', label: 'Phân biệt' },
                      ] as const
                    ).map(({ key, icon, label }) => {
                      const val = g.details![key];
                      if (!val || (typeof val === 'string' && !val.trim())) return null;
                      return (
                        <DetailCard key={key} icon={icon} label={label}>
                          {val}
                        </DetailCard>
                      );
                    })}
                    {g.details.cases && g.details.cases.length > 0 && (
                      <DetailCard icon="📋" label="Phân loại">
                        <ul className="space-y-1 mt-1">
                          {g.details.cases.map((item, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="text-amber-600 shrink-0 font-bold text-sm">{j + 1}.</span>
                              <span className="text-sm break-words">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </DetailCard>
                    )}
                    {g.details.tense_distinction && g.details.tense_distinction.length > 0 && (
                      <DetailCard icon="⏳" label="Phân biệt thì">
                        <ul className="space-y-1 mt-1">
                          {g.details.tense_distinction.map((item, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="text-amber-600 shrink-0 font-bold text-sm">{j + 1}.</span>
                              <span className="text-sm break-words">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </DetailCard>
                    )}
                  </div>
                )}

                {g.note && (
                  <div className="rounded-r-xl px-4 py-3 space-y-3 bg-orange-50 border-l-4 border-amber-500">
                    {g.note.split(/(?=\[)/).filter(Boolean).map((section, idx) => {
                      const match = section.match(/^\[(.+?)\][：:]?\s*([\s\S]*)/);
                      if (match) {
                        const content = match[2].trim();
                        const numbered = content.split(/(?=\d+[\.\、]\s*)/).filter((s) => s.trim());
                        if (numbered.length > 1) {
                          return (
                            <div key={idx}>
                              <div className="text-sm font-bold text-gray-800">{match[1]}:</div>
                              <ul className="space-y-1 mt-1">
                                {numbered.map((item, j) => (
                                  <li key={j} className="flex gap-2">
                                    <span className="text-amber-600 shrink-0 font-bold text-sm">{j + 1}.</span>
                                    <span className="text-sm break-words text-gray-700">
                                      {item.replace(/^\d+[\.\、]\s*/, '')}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        return (
                          <div key={idx} className="text-sm text-gray-700">
                            <span className="font-bold">{match[1]}:</span> <span>{content}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="text-sm text-gray-700">
                          💡 {section}
                        </div>
                      );
                    })}
                  </div>
                )}

                {g.usages && g.usages.length > 0 ? (
                  <div className="space-y-3">
                    {g.usages.map((u, ui) => {
                      const ex = u.example as string | GrammarExample | undefined;
                      const exText = getExampleText(ex);
                      const exPattern = u.pattern || g.pattern;
                      return (
                        <div
                          key={ui}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded shrink-0">
                              {u.label}
                            </span>
                            {u.pattern && (
                              <span className="text-xs font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                                {u.pattern}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{u.meaning}</div>
                          {exText && (
                            <ExampleBlock
                              japanese={exText}
                              pattern={exPattern}
                              hiragana={u.exampleHiragana || getExampleHiragana(ex)}
                              romaji={u.exampleRomaji || getExampleRomaji(ex)}
                              meaning={u.exampleMeaning || getExampleMeaning(ex)}
                            />
                          )}
                          {u.note && <div className="text-sm text-gray-500">💡 {u.note}</div>}
                        </div>
                      );
                    })}
                    {g.example != null && getExampleText(g.example) && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <ExampleBlock
                          japanese={getExampleText(g.example)}
                          pattern={g.pattern}
                          hiragana={g.exampleHiragana || getExampleHiragana(g.example)}
                          romaji={g.exampleRomaji || getExampleRomaji(g.example)}
                          meaning={g.exampleMeaning || getExampleMeaning(g.example)}
                        />
                      </div>
                    )}
                  </div>
                ) : g.example != null && getExampleText(g.example) ? (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <ExampleBlock
                      japanese={getExampleText(g.example)}
                      pattern={g.pattern}
                      hiragana={g.exampleHiragana || getExampleHiragana(g.example)}
                      romaji={g.exampleRomaji || getExampleRomaji(g.example)}
                      meaning={g.exampleMeaning || getExampleMeaning(g.example)}
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">Chưa có ví dụ</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
