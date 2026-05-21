'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { sessionCards } from '@/data/session-cards';
import { sessionGrammar } from '@/data/session-grammar';

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
  const [notes, setNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw) setNotes(JSON.parse(raw));
  }, []);

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📅 Lịch học</h1>
      <p className="text-sm text-gray-500 mb-4">45 buổi • 3 buổi/tuần (T2, T4, T6)</p>

      <div className="space-y-2">
        {schedule.map((s) => {
          const { display, day } = formatDate(s.date);
          const status = getStatus(s.date);
          const note = notes[s.session] || '';

          return (
            <div key={s.session}
              className={`rounded-xl p-4 border transition-all ${
                status === 'today' ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' :
                status === 'past' ? 'bg-gray-50 border-gray-200 opacity-70' :
                'bg-white border-gray-100 shadow-sm'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    status === 'today' ? 'bg-indigo-500 text-white' :
                    status === 'past' ? 'bg-gray-300 text-white' :
                    'bg-gradient-to-br from-rose-400 to-pink-500 text-white'
                  }`}>
                    {s.session}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">
                      Buổi {s.session}
                      {status === 'today' && <span className="ml-2 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">Hôm nay</span>}
                      {status === 'past' && <span className="ml-2 text-xs text-gray-400">✓</span>}
                    </div>
                    <div className="text-xs text-gray-500">{day} • {display}</div>
                  </div>
                </div>
                <Link href={`/schedule/${s.session}`}
                  className="text-xs px-2 py-1 text-gray-400 hover:text-indigo-500">
                  {note ? '📝 Xem' : '+ Note'}
                </Link>
              </div>

              {note && (
                <p className="mt-2 text-xs text-indigo-500 italic pl-13 line-clamp-1" dangerouslySetInnerHTML={{ __html: note.replace(/<[^>]*>/g, ' ').slice(0, 80) }} />
              )}
              {sessionCards[s.session] && (
                <Link href={`/schedule/${s.session}/flashcard`} className="mt-2 inline-block text-xs px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg font-medium hover:bg-indigo-200">
                  🃏 Flashcard ({sessionCards[s.session].length} từ)
                </Link>
              )}
              {sessionGrammar[s.session] && (
                <Link href={`/schedule/${s.session}/grammar`} className="mt-2 ml-2 inline-block text-xs px-3 py-1 bg-violet-100 text-violet-600 rounded-lg font-medium hover:bg-violet-200">
                  📐 Ngữ pháp ({sessionGrammar[s.session].length})
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
