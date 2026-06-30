'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { sessionGrammar } from '@/data/session-grammar';
import { supabase } from '@/lib/supabase';

const schedule = [
  { session: 1, date: '2026-05-19' }, { session: 2, date: '2026-05-21' }, { session: 3, date: '2026-05-23' },
  { session: 4, date: '2026-05-26' }, { session: 5, date: '2026-05-28' }, { session: 6, date: '2026-05-30' },
  { session: 7, date: '2026-06-02' }, { session: 8, date: '2026-06-04' }, { session: 9, date: '2026-06-06' },
  { session: 10, date: '2026-06-09' }, { session: 11, date: '2026-06-11' }, { session: 12, date: '2026-06-13' },
  { session: 13, date: '2026-06-16' }, { session: 14, date: '2026-06-18' }, { session: 15, date: '2026-06-20' },
  { session: 16, date: '2026-06-23' }, { session: 17, date: '2026-06-25' }, { session: 18, date: '2026-06-27' },
  { session: 19, date: '2026-06-30' }, { session: 20, date: '2026-07-02' }, { session: 21, date: '2026-07-04' },
  { session: 22, date: '2026-07-07' }, { session: 23, date: '2026-07-09' }, { session: 24, date: '2026-07-11' },
  { session: 25, date: '2026-07-14' }, { session: 26, date: '2026-07-16' }, { session: 27, date: '2026-07-18' },
  { session: 28, date: '2026-07-21' }, { session: 29, date: '2026-07-23' }, { session: 30, date: '2026-07-25' },
  { session: 31, date: '2026-07-28' }, { session: 32, date: '2026-07-30' }, { session: 33, date: '2026-08-01' },
  { session: 34, date: '2026-08-04' }, { session: 35, date: '2026-08-06' }, { session: 36, date: '2026-08-08' },
  { session: 37, date: '2026-08-11' }, { session: 38, date: '2026-08-13' }, { session: 39, date: '2026-08-15' },
  { session: 40, date: '2026-08-18' }, { session: 41, date: '2026-08-20' }, { session: 42, date: '2026-08-22' },
  { session: 43, date: '2026-08-25' }, { session: 44, date: '2026-08-27' }, { session: 45, date: '2026-08-29' },
];

function getExText(ex: any): string {
  if (ex == null) return '';
  return typeof ex === 'string' ? ex : ex.japanese || '';
}

function getExRomaji(ex: any): string {
  if (ex == null) return '';
  return typeof ex === 'string' ? '' : ex.romaji || '';
}

function getExHiragana(ex: any): string {
  if (ex == null) return '';
  return typeof ex === 'string' ? '' : ex.hiragana || '';
}

function getExMeaning(ex: any): string {
  if (ex == null) return '';
  return typeof ex === 'string' ? '' : ex.vietnamese || '';
}

export default function GrammarSummaryPage() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [cloudData, setCloudData] = useState<Record<number, any[]>>({});
  const [search, setSearch] = useState('');
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSessions, setMergeSessions] = useState<Set<number>>(new Set());
  const [mergedItems, setMergedItems] = useState<{ session: number; index: number; items: any[] }[]>([]);

  useEffect(() => {
    supabase
      .from('session_data')
      .select('session_num, items')
      .eq('type', 'grammar')
      .then(({ data }) => {
        if (data) {
          const map: Record<number, any[]> = {};
          for (const row of data) {
            map[row.session_num] = (row.items as any[]) || [];
          }
          setCloudData(map);
        }
      });
  }, []);

  const grammarSessions = useMemo(() => schedule.filter((s) => {
    const local = sessionGrammar[s.session] && sessionGrammar[s.session].length > 0;
    const cloud = cloudData[s.session] && cloudData[s.session].length > 0;
    return local || cloud;
  }), [cloudData]);

  const activeSession = selectedSession ?? (grammarSessions.length > 0 ? grammarSessions[0].session : null);

  const localItems = (activeSession ? sessionGrammar[activeSession] : []) || [];
  const cloudItems = (activeSession ? cloudData[activeSession] : []) || [];

  const allItems = useMemo(() => {
    const raw = [...localItems, ...cloudItems];
    return raw.map((item: any, idx: number) => {
      const usages = (item.usages || []).map((u: any) => ({
        label: u.label || '',
        meaning: u.meaning || '',
        pattern: u.pattern || '',
        example: u.example || null,
        exampleRomaji: u.exampleRomaji || '',
        exampleHiragana: u.exampleHiragana || '',
        exampleMeaning: u.exampleMeaning || '',
        note: u.note || '',
      }));

      return {
        id: `${activeSession}-${idx}`,
        pattern: item.pattern || '',
        meaning: item.meaning || '',
        jlpt: item.jlpt || '',
        connections: item.connections || [],
        usages,
        singleExample: item.example || null,
        singleRomaji: item.exampleRomaji || '',
        singleHiragana: item.exampleHiragana || '',
        singleMeaning: item.exampleMeaning || '',
      };
    });
  }, [localItems, cloudItems, activeSession]);

  const searchedItems = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase().trim();
    return allItems.filter(item => {
      if (item.pattern.toLowerCase().includes(q)) return true;
      if (item.meaning.toLowerCase().includes(q)) return true;
      for (const u of item.usages) {
        if (u.meaning.toLowerCase().includes(q)) return true;
        if (getExText(u.example).toLowerCase().includes(q)) return true;
      }
      if (getExText(item.singleExample).toLowerCase().includes(q)) return true;
      return false;
    });
  }, [allItems, search]);

  const countInSession = (session: number) => {
    const local = sessionGrammar[session] || [];
    const cloud = cloudData[session] || [];
    return local.length + cloud.length;
  };

  const copyText = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }, []);

  const activeIdx = grammarSessions.findIndex(s => s.session === activeSession);
  const prevSession = activeIdx > 0 ? grammarSessions[activeIdx - 1].session : null;
  const nextSession = activeIdx < grammarSessions.length - 1 ? grammarSessions[activeIdx + 1].session : null;

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <Link href="/schedule" className="text-sm text-gray-500 hover:text-indigo-500 transition-colors flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Lịch học
          </Link>
          <span className="text-gray-300 text-xs">/</span>
          <span className="text-sm text-gray-800 font-medium">Tổng hợp ngữ pháp</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">📐 Tổng hợp ngữ pháp</h1>
        <p className="text-sm text-gray-500 mb-5">Tra cứu ngữ pháp theo từng buổi học.</p>

        {grammarSessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-lg font-bold text-gray-800">Chưa có ngữ pháp nào trong lịch học</p>
          </div>
        ) : (
          <>
            {/* Search + Merge toggle */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kiếm ngữ pháp, cách dùng, ví dụ…"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <button
                onClick={() => { setMergeMode(!mergeMode); if (mergeMode) { setMergeSessions(new Set()); setMergedItems([]); } }}
                className={`shrink-0 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  mergeMode ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                📋 Ghép bài
              </button>
            </div>

            {/* Session pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {grammarSessions.map((s, si) => {
                const isActive = !mergeMode && s.session === activeSession;
                const isSelected = mergeMode && mergeSessions.has(s.session);
                const count = countInSession(s.session);
                const handleClick = () => {
                  if (mergeMode) {
                    setMergeSessions(prev => {
                      const next = new Set(prev);
                      if (next.has(s.session)) next.delete(s.session); else next.add(s.session);
                      return next;
                    });
                  } else {
                    setSelectedSession(s.session);
                    setSearch('');
                  }
                };
                return (
                  <button
                    key={s.session}
                    onClick={handleClick}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'text-white shadow-md'
                        : isSelected
                          ? 'text-amber-700 bg-amber-50 border-2 border-amber-400 shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                    style={isActive ? { background: 'linear-gradient(135deg, #6C63FF, #8B7CFF)' } : {}}
                  >
                    {mergeMode && (
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[9px] font-bold ${
                        isSelected ? 'bg-amber-400 border-amber-400 text-white' : 'border-gray-300'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </span>
                    )}
                    Bài {si}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-white/20 text-white' : isSelected ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Merge action bar */}
            {mergeMode && mergeSessions.size > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-sm text-amber-800 font-medium">Đã chọn {mergeSessions.size} buổi</span>
                <div className="flex-1" />
                <button
                  onClick={() => {
                    const sorted = Array.from(mergeSessions).sort((a, b) => a - b);
                    const data: { session: number; index: number; items: any[] }[] = [];
                    for (const sn of sorted) {
                      const local = sessionGrammar[sn] || [];
                      const cloud = cloudData[sn] || [];
                      const items = [...local, ...cloud].map((item: any, idx: number) => {
                        const usages = (item.usages || []).map((u: any) => ({
                          label: u.label || '',
                          meaning: u.meaning || '',
                          pattern: u.pattern || '',
                          example: u.example || null,
                          exampleRomaji: u.exampleRomaji || '',
                          exampleHiragana: u.exampleHiragana || '',
                          exampleMeaning: u.exampleMeaning || '',
                          note: u.note || '',
                        }));
                        return {
                          id: `${sn}-${idx}`,
                          pattern: item.pattern || '',
                          meaning: item.meaning || '',
                          connections: item.connections || [],
                          usages,
                          singleExample: item.example || null,
                          singleRomaji: item.exampleRomaji || '',
                          singleHiragana: item.exampleHiragana || '',
                          singleMeaning: item.exampleMeaning || '',
                        };
                      });
                      data.push({ session: sn, index: grammarSessions.findIndex(s => s.session === sn), items });
                    }
                    setMergedItems(data);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  Tổng hợp
                </button>
              </div>
            )}

            {/* Status */}
            {activeSession && (
              <p className="text-sm text-gray-500 mb-3">
                <span className="font-medium text-gray-700">Bài {activeIdx}</span>
                {' · '}{allItems.length} mẫu ngữ pháp
              </p>
            )}

            {/* Desktop: Table / Mobile: stacked */}
            {activeSession && searchedItems.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, #6C63FF, #8B7CFF)' }}>
                          <th className="text-left px-4 py-3 font-semibold text-white text-[13px] w-[130px]">Ngữ Pháp</th>
                          <th className="text-left px-4 py-3 font-semibold text-white text-[13px] w-[200px]">Cách dùng</th>
                          <th className="text-left px-4 py-3 font-semibold text-white text-[13px]">Ví dụ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchedItems.map((item, i) => {
                          const usageList = item.usages.length > 0 ? item.usages : [{
                            label: '',
                            meaning: item.meaning,
                            pattern: '',
                            example: item.singleExample,
                            exampleRomaji: item.singleRomaji,
                            exampleHiragana: item.singleHiragana,
                            exampleMeaning: item.singleMeaning,
                            note: '',
                          }];

                          const itemRomaji = item.singleRomaji || getExRomaji(item.singleExample);
                          const itemHiragana = item.singleHiragana || getExHiragana(item.singleExample);
                          const itemMeaning = item.singleMeaning || getExMeaning(item.singleExample);

                          return usageList.map((u: any, ui: number) => {
                            const exRomaji = u.exampleRomaji || getExRomaji(u.example) || itemRomaji;
                            const exHiragana = u.exampleHiragana || getExHiragana(u.example) || itemHiragana;
                            const exMeaning = u.exampleMeaning || getExMeaning(u.example) || itemMeaning;
                            return (
                            <tr key={`${item.id}-${ui}`} className={`${(i + ui) % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} transition-colors hover:bg-indigo-50/40`}>
                              {/* Pattern - only first usage row */}
                              {ui === 0 ? (
                                <td className="px-4 py-3 align-top" rowSpan={usageList.length}>
                                   {item.connections.length > 0 && (
                                    <div className="mt-1.5 space-y-0.5">
                                      {item.connections.map((c: any, ci: number) => (
                                        <div key={ci} className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                          {c.type}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  +
                                  <Link
                                    href={`/schedule/${activeSession}/grammar`}
                                    className="font-bold text-gray-800 text-[13px] font-mono hover:text-indigo-600 transition-colors block leading-relaxed"
                                  >
                                    {item.pattern}
                                  </Link>
                                </td>
                              ) : null}
                              {/* Usage */}
                              <td className="px-4 py-3 align-top">
                                {u.label && (
                                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded inline-block mb-1">{u.label}</span>
                                )}
                                <p className="text-[13px] text-gray-600 leading-relaxed">{u.meaning}</p>
                                {u.pattern && (
                                  <p className="text-[11px] font-mono text-indigo-600 mt-0.5">{u.pattern}</p>
                                )}
                                {u.note && (
                                  <p className="text-[12px] text-gray-500 mt-1 flex items-start gap-1">
                                    <span className="text-gray-400 shrink-0">💡</span>
                                    <span>{u.note}</span>
                                  </p>
                                )}
                              </td>
                              {/* Example */}
                              <td className="px-4 py-3 align-top">
                                {u.example != null ? (
                                  <div className="space-y-0.5">
                                    <div className="flex items-start gap-1">
                                      <span className="text-[13px] text-gray-700 leading-relaxed">
                                        {getExText(u.example)}
                                      </span>
                                      <button
                                        onClick={() => copyText(getExText(u.example))}
                                        className="shrink-0 text-indigo-300 hover:text-indigo-500 transition-colors mt-0.5"
                                        title="Sao chép"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                      </button>
                                    </div>
                                    {exHiragana && (
                                      <p className="text-[12px] text-gray-500">{exHiragana}</p>
                                    )}
                                    {/* {exRomaji && (
                                      <p className="text-[12px] text-gray-500 italic">{exRomaji}</p>
                                    )} */}
                                    {exMeaning && (
                                      <p className="text-[12px] text-gray-500">{exMeaning}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic text-[12px]">Đang cập nhật</span>
                                )}
                              </td>
                            </tr>
                            );
                          });
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2.5">
                  {searchedItems.map((item) => {
                    const usageList = item.usages.length > 0 ? item.usages : [{
                      label: '',
                      meaning: item.meaning,
                      pattern: '',
                      example: item.singleExample,
                      exampleRomaji: item.singleRomaji,
                      exampleHiragana: item.singleHiragana,
                      exampleMeaning: item.singleMeaning,
                      note: '',
                    }];

                    const itemRomaji = item.singleRomaji || getExRomaji(item.singleExample);
                    const itemHiragana = item.singleHiragana || getExHiragana(item.singleExample);
                    const itemMeaning = item.singleMeaning || getExMeaning(item.singleExample);

                    return (
                      <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 space-y-2.5">
                        <Link
                          href={`/schedule/${activeSession}/grammar`}
                          className="font-bold text-gray-800 text-[13px] font-mono hover:text-indigo-600 transition-colors block leading-relaxed"
                        >
                          {item.pattern}
                        </Link>
                        +
                        {item.connections.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.connections.map((c: any, ci: number) => (
                              <span key={ci} className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {c.type}
                              </span>
                            ))}
                          </div>
                        )}
                        {usageList.map((u: any, ui: number) => {
                          const exRomaji = u.exampleRomaji || getExRomaji(u.example) || itemRomaji;
                          const exHiragana = u.exampleHiragana || getExHiragana(u.example) || itemHiragana;
                          const exMeaning = u.exampleMeaning || getExMeaning(u.example) || itemMeaning;
                          return (
                          <div key={ui} className="border-t border-gray-50 pt-2 first:border-0 first:pt-0">
                            {u.label && (
                              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded inline-block mb-1">{u.label}</span>
                            )}
                            <p className="text-[13px] text-gray-600 leading-relaxed">{u.meaning}</p>
                            {u.pattern && <p className="text-[11px] font-mono text-indigo-600 mt-0.5">{u.pattern}</p>}
                            {u.example != null && (
                              <div className="mt-1.5 bg-gray-50 rounded-lg p-2.5 space-y-0.5">
                                <div className="flex items-start gap-1">
                                  <span className="text-[13px] text-gray-700 leading-relaxed">{getExText(u.example)}</span>
                                  <button onClick={() => copyText(getExText(u.example))} className="shrink-0 text-indigo-300 hover:text-indigo-500 mt-0.5" title="Sao chép">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                  </button>
                                </div>
                                {exHiragana && (
                                  <p className="text-[12px] text-gray-500">{exHiragana}</p>
                                )}
                                {/* {exRomaji && (
                                  <p className="text-[12px] text-gray-500 italic">{exRomaji}</p>
                                )} */}
                                {exMeaning && (
                                  <p className="text-[12px] text-gray-500">{exMeaning}</p>
                                )}
                              </div>
                            )}
                            {u.note && (
                              <p className="text-[12px] text-gray-500 mt-1 flex items-start gap-1">
                                <span className="text-gray-400 shrink-0">💡</span>
                                <span>{u.note}</span>
                              </p>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : activeSession && searchedItems.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-gray-400">
                  {search ? 'Không tìm thấy ngữ pháp phù hợp' : `Bài ${activeIdx} chưa có ngữ pháp`}
                </p>
              </div>
            ) : null}

            {/* Merged multi-session view */}
            {mergedItems.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-800">📋 Tổng hợp {mergedItems.length} buổi</h2>
                  <button
                    onClick={() => {
                      let html = '<html><head><meta charset="utf-8"><style>' +
'@page { size: A4; margin: 15mm 12mm 22mm; @bottom-center { content: "Trang " counter(page) " / " counter(pages); font-size: 9px; color: #999; font-family: sans-serif; } }' +
'body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 12px; color: #222; margin: 0; padding: 0; }' +
'.title { font-size: 20px; color: #222; margin-bottom: 16px; letter-spacing: -0.3px; }' +
'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }' +
'th { background: #e0e7ff; color: #000; padding: 10px 14px; text-align: left; font-size: 12px; border: 1px solid #c7d2fe; }' +
'td { padding: 12px 14px; border: 1px solid #e0e0e0; vertical-align: top; font-size: 11px; line-height: 1.5; }' +
'tr:nth-child(even) td { background: #fafafa; }' +
'.sh { background: #e0e7ff; color: #000; padding: 7px 14px; font-size: 13px; font-weight: 800 }' +
'.pattern { font-size: 16px; font-weight: 800; color: #1e40af; font-family: "Hiragino Sans", "Noto Sans JP", sans-serif; margin-bottom: 3px; }' +
'.conn { font-size: 11px; color: #4338ca; background: #eef2ff; padding: 2px 8px; border-radius: 3px; display: inline-block; margin-top: 4px; font-family: "Hiragino Sans", "Noto Sans JP", sans-serif; }' +
'.meaning-label { font-size: 10px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }' +
'.meaning-text { font-size: 13px; color: #222; line-height: 1.5; margin-bottom: 6px; }' +
'.usage-divider { border: none; border-top: 1px dashed #d1d5db; margin: 8px 0; }' +
'.usage-label { font-size: 10px; font-weight: 700; color: #d97706; background: #fffbeb; padding: 2px 8px; border-radius: 3px; display: inline-block; margin-bottom: 4px; }' +
'.jp-example { font-size: 14px; color: #111; line-height: 1.7; font-weight: 500; font-family: "Hiragino Sans", "Noto Sans JP", sans-serif; }' +
'.jp-sub { font-size: 11px; color: #888; font-style: italic; margin-top: 2px; }' +
'.vn-meaning { font-size: 12px; color: #666; font-style: italic; margin-top: 2px; }' +
'.note-block { font-size: 11px; color: #92400e; background: #fef3c7; padding: 6px 10px; border-radius: 4px; margin-top: 6px; border-left: 3px solid #f59e0b; }' +
'.note-icon { margin-right: 4px; }' +
'.pattern-block { margin-bottom: 4px; }' +
'</style></head><body>' +
'<div class="title">&#x1F4D8; Tổng hợp ngữ pháp</div>';
'.pattern { font-weight: 700; }' +
'.conn { font-size: 10px; color: #5b21b6; background: #eef2ff; padding: 1px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; }' +
'.label { font-size: 10px; font-weight: 700; color: #d97706; background: #fffbeb; padding: 1px 6px; border-radius: 4px; display: inline-block; margin-bottom: 2px; }' +
'.ex-text { font-size: 12px; color: #555; }' +
'.ex-sub { font-size: 10px; color: #888; }' +
'.ex-meaning { font-size: 11px; color: #666; }' +
'</style></head><body>' +
'<div style="font-size:18px;font-weight:700;margin-bottom:20px">Tổng hợp ngữ pháp</div>';

                      for (const group of mergedItems) {
                        const si = group.index;
                        html += '<div class="sh" style="display:flex;justify-content:space-between;align-items:center">' +
                          '<span  style="font-weight:400;">Bài ' + si + '</span>' +
                          '<span style="font-weight:400;font-size:11px;opacity:0.85">' + group.items.length + ' mẫu ngữ pháp</span>' +
                        '</div>';
                        html += '<table><thead><tr><th style="width:28%">Ngữ Pháp</th><th style="width:34%">Cách dùng</th><th>Ví dụ</th></tr></thead><tbody>';

                        for (const item of group.items) {
                          const usageList = item.usages.length > 0 ? item.usages : [{
                            label: '', meaning: item.meaning, pattern: '', example: item.singleExample,
                            exampleRomaji: item.singleRomaji, exampleHiragana: item.singleHiragana,
                            exampleMeaning: item.singleMeaning, note: '',
                          }];

                          for (let ui = 0; ui < usageList.length; ui++) {
                            const u = usageList[ui];

                            // --- Pattern column ---
                            let patternCell = '';
                            if (ui === 0) {
                              patternCell = '<div class="pattern-block">';
                              patternCell += '<div class="pattern">' + item.pattern + '</div>';
                              if (item.meaning) {
                                patternCell += '<div class="meaning-label">Ý nghĩa</div>';
                                patternCell += '<div class="meaning-text">' + item.meaning + '</div>';
                              }
                              if (item.connections.length > 0) {
                                patternCell += item.connections.map((c: any) => '<div class="conn">' + c.type + '</div>').join('');
                              }
                              patternCell += '</div>';
                            }

                            // --- Usage column ---
                            let usageCell = '';
                            if (u.label) usageCell += '<div class="usage-label">' + u.label + '</div>';
                            usageCell += '<div class="meaning-text">' + u.meaning.replace(/\n/g, '<br>') + '</div>';
                            if (u.pattern) usageCell += '<div class="conn" style="margin-top:4px;background:#ede9fe;color:#4338ca">' + u.pattern + '</div>';

                            // --- Example column ---
                            let exampleCell = '';
                            if (u.example != null) {
                              exampleCell += '<div class="jp-example">' + getExText(u.example) + '</div>';
                              if (u.exampleHiragana) exampleCell += '<div class="jp-sub">' + u.exampleHiragana + '</div>';
                              if (u.exampleRomaji) exampleCell += '<div class="jp-sub">' + u.exampleRomaji + '</div>';
                              if (u.exampleMeaning) exampleCell += '<div class="vn-meaning">' + u.exampleMeaning + '</div>';
                            } else if (ui === 0) {
                              exampleCell = '<span style="color:#aaa;font-style:italic;font-size:10px">Đang cập nhật</span>';
                            }

                            // --- Note ---
                            if (u.note) {
                              exampleCell += '<div class="note-block"><span class="note-icon">&#x1F4A1;</span>' + u.note + '</div>';
                            }

                            html += '<tr><td>' + patternCell + '</td><td>' + usageCell + '</td><td>' + exampleCell + '</td></tr>';
                          }
                        }

                        html += '</tbody></table>';
                      }

                      html += '</body></html>';

                      const blob = new Blob([html], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const iframe = document.createElement('iframe');
                      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px';
                      document.body.appendChild(iframe);
                      iframe.onload = () => {
                        iframe.contentWindow?.print();
                      };
                      iframe.src = url;
                      const cleanup = () => {
                        if (iframe.parentNode) { document.body.removeChild(iframe); }
                        URL.revokeObjectURL(url);
                      };
                      window.addEventListener('focus', cleanup, { once: true });
                      setTimeout(cleanup, 120000);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Xuất PDF
                  </button>
                </div>
                <div className="space-y-6">
                  {mergedItems.map(group => {
                    const si = group.index;
                    return (
                      <div key={group.session} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-2.5 font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #6C63FF, #8B7CFF)' }}>
                          Bài {si} — {group.items.length} ngữ pháp
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-[13px] w-[140px]">Ngữ Pháp</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-[13px] w-[200px]">Cách dùng</th>
                                <th className="text-left px-4 py-2.5 font-semibold text-gray-700 text-[13px]">Ví dụ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item: any, i: number) => {
                                const usageList = item.usages.length > 0 ? item.usages : [{
                                  label: '', meaning: item.meaning, pattern: '',
                                  example: item.singleExample, exampleRomaji: item.singleRomaji,
                                  exampleHiragana: item.singleHiragana, exampleMeaning: item.singleMeaning, note: '',
                                }];
                                const itemRomaji = item.singleRomaji || '';
                                const itemHiragana = item.singleHiragana || '';
                                const itemMeaning = item.singleMeaning || '';
                                return usageList.map((u: any, ui: number) => {
                                  const exRomaji = u.exampleRomaji || itemRomaji;
                                  const exHiragana = u.exampleHiragana || itemHiragana;
                                  const exMeaning = u.exampleMeaning || itemMeaning;
                                  return (
                                  <tr key={`${item.id}-${ui}`} className={`${(i + ui) % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    {ui === 0 ? (
                                      <td className="px-4 py-3 align-top" rowSpan={usageList.length}>
                                        {item.connections.length > 0 && (
                                          <div className="mt-1.5 space-y-0.5">
                                            {item.connections.map((c: any, ci: number) => (
                                              <div key={ci} className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{c.type}</div>
                                            ))}
                                          </div>
                                        )}
                                        +
                                        <p className="font-bold text-gray-800 text-[13px] font-mono leading-relaxed">{item.pattern}</p>
                                      </td>
                                    ) : null}
                                    <td className="px-4 py-3 align-top">
                                      {u.label && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded inline-block mb-1">{u.label}</span>}
                                      <p className="text-[13px] text-gray-600 leading-relaxed">{u.meaning}</p>
                                      {u.pattern && <p className="text-[11px] font-mono text-indigo-600 mt-0.5">{u.pattern}</p>}
                                      {u.note && <p className="text-[12px] text-gray-500 mt-1 flex items-start gap-1"><span className="text-gray-400 shrink-0">💡</span><span>{u.note}</span></p>}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                      {u.example != null ? (
                                        <div className="space-y-0.5">
                                          <div className="flex items-start gap-1">
                                            <span className="text-[13px] text-gray-700 leading-relaxed">{getExText(u.example)}</span>
                                            <button onClick={() => copyText(getExText(u.example))} className="shrink-0 text-indigo-300 hover:text-indigo-500 transition-colors mt-0.5" title="Sao chép">
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                            </button>
                                          </div>
                                          {exHiragana && <p className="text-[12px] text-gray-500">{exHiragana}</p>}
                                          {/* {exRomaji && <p className="text-[12px] text-gray-500 italic">{exRomaji}</p>} */}
                                          {exMeaning && <p className="text-[12px] text-gray-500">{exMeaning}</p>}
                                        </div>
                                      ) : <span className="text-gray-400 italic text-[12px]">Đang cập nhật</span>}
                                    </td>
                                  </tr>
                                  );
                                });
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prev / Next */}
            {activeSession && allItems.length > 0 && (
              <div className="flex items-center justify-between mt-5">
                {prevSession ? (
                  <button
                    onClick={() => { setSelectedSession(prevSession); setSearch(''); }}
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Bài {activeIdx - 1}
                  </button>
                ) : <div />}
                {nextSession ? (
                  <button
                    onClick={() => { setSelectedSession(nextSession); setSearch(''); }}
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                  >
                    Bài {activeIdx + 1}
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                ) : <div />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
