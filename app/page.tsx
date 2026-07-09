'use client';

import { useEffect, useState } from 'react';
import { loadProgress, getDueCount } from '@/lib/store';
import { getStudyStreak } from '@/lib/session';
import { useAuth } from '@/lib/auth';
import { getRestrictMode, setRestrictMode } from '@/lib/session-data';
import Link from 'next/link';
import HomeHeader from '@/app/components/HomeHeader';
import StatsRow from '@/app/components/StatsRow';
import BentoGrid from '@/app/components/BentoGrid';
import {
  TOTAL_SESSIONS,
  getCurrentSession,
  getTodaysSession,
  greetingJa,
  vnTodayISO,
} from '@/data/schedule';

export default function Home() {
  const { isAdmin } = useAuth();
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ cardsDue: 0, totalLearned: 0 });
  const [statsReady, setStatsReady] = useState(false);
  const [restrict, setRestrict] = useState(false);
  const [restrictReady, setRestrictReady] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [isClassToday, setIsClassToday] = useState(false);
  const [greeting, setGreeting] = useState('こんにちは');

  useEffect(() => {
    const today = vnTodayISO();
    setCurrentSession(getCurrentSession(today));
    setIsClassToday(Boolean(getTodaysSession(today)));
    setGreeting(greetingJa());

    try {
      const progress = loadProgress();
      setStreak(getStudyStreak(progress.completedDates));
      setStats({
        cardsDue: getDueCount(progress),
        totalLearned: (progress.cards || []).length,
      });
    } catch {
      /* ignore corrupt local progress */
    }
    setStatsReady(true);

    getRestrictMode()
      .then(setRestrict)
      .catch(() => {})
      .finally(() => setRestrictReady(true));

    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const t = vnTodayISO();
      setCurrentSession(getCurrentSession(t));
      setIsClassToday(Boolean(getTodaysSession(t)));
      setGreeting(greetingJa());
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const restrictUser = !isAdmin && restrict;

  async function toggleRestrict() {
    const v = !restrict;
    setRestrict(v);
    try {
      await setRestrictMode(v);
    } catch {
      setRestrict(!v);
    }
  }

  return (
    <main className="min-h-screen p-4 pb-24 max-w-md mx-auto space-y-5">
      <HomeHeader
        streak={streak}
        currentSession={currentSession}
        totalSessions={TOTAL_SESSIONS}
        greeting={greeting}
      />

      {!restrictUser && (
        <StatsRow
          cardsDue={stats.cardsDue}
          totalLearned={stats.totalLearned}
          currentSession={currentSession}
          isClassToday={isClassToday}
          ready={statsReady}
        />
      )}

      <BentoGrid currentSession={currentSession} restrictUser={restrictUser} />

      {isAdmin && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-300">🔒 Giới hạn user</span>
          <button
            type="button"
            role="switch"
            aria-checked={restrict}
            aria-label="Giới hạn user"
            disabled={!restrictReady}
            onClick={toggleRestrict}
            className={`w-12 h-6 rounded-full transition-all relative ${restrict ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${restrict ? 'left-6' : 'left-0.5'}`}
            />
          </button>
        </div>
      )}

      {!restrictUser && (
        <div className="flex gap-3">
          <Link
            href="/grammar-reference"
            className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            📖 Ngữ pháp
          </Link>
          <Link
            href="/conjugation-reference"
            className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            🔄 Chia ĐT
          </Link>
          <Link
            href="/tips"
            className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            💡 Mẹo
          </Link>
          <Link
            href="/more"
            className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            📎 Thêm
          </Link>
        </div>
      )}
    </main>
  );
}
