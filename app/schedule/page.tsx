'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { sessionCards } from '@/data/session-cards';
import { sessionGrammar } from '@/data/session-grammar';
import { sessionKanji } from '@/data/session-kanji';
import { getAllSessionData } from '@/lib/session-data';

const NOTES_KEY = 'nihongo_schedule_notes';

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

function formatDate(d: string) {
  const date = new Date(d);
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return { display: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`, day: days[date.getDay()] };
}

function getStatus(date: string): 'past' | 'today' | 'future' {
  const today = new Date().toISOString().split('T')[0];
  if (date < today) return 'past';
  if (date === today) return 'today';
  return 'future';
}

export default function SchedulePage() {
  const { isAdmin } = useAuth();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [cloudData, setCloudData] = useState<{ session_num: number; type: string; count: number }[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw) setNotes(JSON.parse(raw));
    getAllSessionData().then(setCloudData);
  }, []);

  function hasCloud(session: number, type: string) {
    return cloudData.some(d => d.session_num === session && d.type === type);
  }

  function cloudCount(session: number, type: string) {
    return cloudData.find(d => d.session_num === session && d.type === type)?.count || 0;
  }

  const completed = schedule.filter(s => getStatus(s.date) === 'past').length;
  const pct = Math.round((completed / schedule.length) * 100);

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">📅 Lịch học</h1>
        <p className="text-sm text-gray-500 mb-3">45 buổi • 3 buổi/tuần (T3, T5, T7)</p>

        {/* Progress bar - thick & green gradient */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-medium">{completed} / {schedule.length} hoàn thành</span>
            <span className="font-bold" style={{ color: '#22C55E' }}>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #22C55E, #16A34A)' }} />
          </div>
        </div>

        <Link href="/schedule/quiz" className="block w-full py-3 mb-4 text-center bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow hover:shadow-md transition-all">
          ✍️ Trắc nghiệm tổng hợp
        </Link>

        <div className="space-y-2.5">
          {schedule.map((s) => {
            const { display, day } = formatDate(s.date);
            const status = getStatus(s.date);
            const isToday = status === 'today';
            const isPast = status === 'past';
            const hasContent = sessionCards[s.session] || sessionGrammar[s.session] || sessionKanji[s.session] || hasCloud(s.session, 'flashcard') || hasCloud(s.session, 'grammar') || hasCloud(s.session, 'kanji');

            return (
              <div key={s.session}
                className={`rounded-xl p-4 border-2 relative overflow-hidden transition-all ${
                  isToday ? 'border-[rgba(108,99,255,0.5)] shadow-[0_0_24px_rgba(108,99,255,0.15)]' :
                  isPast ? 'border-gray-200' :
                  'border-gray-200'
                } ${isPast && !hasContent ? 'opacity-50' : isPast ? 'opacity-65' : ''}`}>
                {isToday && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: '#6C63FF' }} />}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      isToday ? 'text-white' : isPast ? 'bg-gray-300 text-white' : 'bg-gray-200 text-gray-500'
                    }`} style={isToday ? { background: '#6C63FF' } : isPast ? { background: '#22C55E' } : {}}>
                      {s.session}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-[15px]">Buổi {s.session}</span>
                        {isPast && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>✓ Done</span>}
                        {isToday && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border" style={{ background: 'rgba(108,99,255,0.12)', color: '#8B7CFF', borderColor: 'rgba(108,99,255,0.25)' }}>Hôm nay</span>}
                      </div>
                      <div className="text-[11px] text-gray-400">{day} • {display}</div>
                    </div>
                  </div>
                  <Link href={`/schedule/${s.session}`} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium">📝 Note ›</Link>
                </div>

                {hasContent && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-12">
                    {(sessionCards[s.session] || hasCloud(s.session, 'flashcard')) && (
                      <Link href={`/schedule/${s.session}/flashcard`} className="text-[10px] px-2 py-1 rounded-md font-medium text-white bg-indigo-500">
                        🃏 Flashcard ({(sessionCards[s.session]?.length || 0) + cloudCount(s.session, 'flashcard')})
                      </Link>
                    )}
                    {(sessionGrammar[s.session] || hasCloud(s.session, 'grammar')) && (
                      <Link href={`/schedule/${s.session}/grammar`} className="text-[10px] px-2 py-1 rounded-md font-medium text-white bg-violet-500">
                        📐 Ngữ pháp ({(sessionGrammar[s.session]?.length || 0) + cloudCount(s.session, 'grammar')})
                      </Link>
                    )}
                    {(sessionKanji[s.session] || hasCloud(s.session, 'kanji')) && (
                      <Link href={`/schedule/${s.session}/kanji-fc`} className="text-[10px] px-2 py-1 rounded-md font-medium text-white bg-rose-500">
                        🈁 Kanji ({(sessionKanji[s.session]?.length || 0) + cloudCount(s.session, 'kanji')})
                      </Link>
                    )}
                    {isAdmin && <Link href={`/upload?session=${s.session}`} className="text-[10px] px-1.5 py-1 text-gray-400 hover:text-gray-600">➕</Link>}
                    <Link href={`/export?session=${s.session}`} className="text-[10px] px-1.5 py-1 text-gray-400 hover:text-gray-600">🖨️</Link>
                  </div>
                )}
                {!hasContent && (
                  <div className="flex items-center gap-1.5 mt-2.5 pl-12">
                    {isAdmin && <Link href={`/upload?session=${s.session}`} className="text-[10px] px-2 py-1 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-md">➕ Thêm</Link>}
                    <Link href={`/export?session=${s.session}`} className="text-[10px] px-2 py-1 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-md">🖨️ In</Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
