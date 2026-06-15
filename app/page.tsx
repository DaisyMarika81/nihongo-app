'use client';

import { useEffect, useState } from 'react';
import { loadProgress, getDueCount, saveProgress } from '@/lib/store';
import { getStudyStreak } from '@/lib/session';
import { useAuth } from '@/lib/auth';
import { getRestrictMode, setRestrictMode } from '@/lib/session-data';
import Link from 'next/link';
import HomeHeader from '@/app/components/HomeHeader';
import StatsRow from '@/app/components/StatsRow';
import BentoGrid from '@/app/components/BentoGrid';

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

function getCurrentSession() {
  const today = new Date().toISOString().split('T')[0];
  return schedule.filter(s => s.date <= today).pop()?.session || 1;
}

export default function Home() {
  const { isAdmin } = useAuth();
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ cardsDue: 0, totalLearned: 0, currentLesson: 1 });
  const [restrict, setRestrict] = useState(false);

  useEffect(() => {
    const progress = loadProgress();
    setStreak(getStudyStreak(progress.completedDates));
    const dueCount = getDueCount(progress);
    setStats({ cardsDue: dueCount, totalLearned: (progress.cards || []).length, currentLesson: progress.currentLesson });
    setRestrict(localStorage.getItem('nihongo_restrict') === 'true');
    getRestrictMode().then(setRestrict);
  }, []);

  const currentSession = getCurrentSession();
  const restrictUser = !isAdmin && restrict;

  return (
    <main className="min-h-screen p-4 pb-24 max-w-md mx-auto space-y-5">
      <HomeHeader streak={streak} currentSession={currentSession} />

      {!restrictUser && (
        <StatsRow cardsDue={stats.cardsDue} totalLearned={stats.totalLearned} currentSession={currentSession} />
      )}

      <BentoGrid currentSession={currentSession} restrictUser={restrictUser} />

      {/* Admin: Restrict toggle */}
      {isAdmin && (
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
          <span className="text-sm text-gray-600">🔒 Giới hạn user</span>
          <button onClick={() => { const v = !restrict; setRestrict(v); setRestrictMode(v); }}
            className={`w-12 h-6 rounded-full transition-all relative ${restrict ? 'bg-indigo-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${restrict ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      )}

      {/* Chức năng phụ */}
      {!restrictUser && (
      <div className="flex gap-3">
        <Link href="/grammar-reference" className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 py-2 rounded-xl border border-gray-100 bg-white">📖 Ngữ pháp</Link>
        <Link href="/conjugation-reference" className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 py-2 rounded-xl border border-gray-100 bg-white">🔄 Chia ĐT</Link>
        <Link href="/tips" className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 py-2 rounded-xl border border-gray-100 bg-white">💡 Mẹo</Link>
        <Link href="/more" className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 py-2 rounded-xl border border-gray-100 bg-white">📎 Thêm</Link>
      </div>
      )}
    </main>
  );
}
