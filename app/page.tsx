'use client';

import { useEffect, useState } from 'react';
import { loadProgress, getDueCount, saveProgress } from '@/lib/store';
import { generateDailySession, getStudyStreak, SessionActivity } from '@/lib/session';
import { useAuth } from '@/lib/auth';
import { getRestrictMode, setRestrictMode } from '@/lib/session-data';
import Link from 'next/link';

export default function Home() {
  const { isAdmin } = useAuth();
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ cardsDue: 0, totalLearned: 0, currentLesson: 1 });
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [showTasks, setShowTasks] = useState(false);
  const [restrict, setRestrict] = useState(false);

  useEffect(() => {
    const progress = loadProgress();
    setStreak(getStudyStreak(progress.completedDates));
    const dueCount = getDueCount(progress);
    setStats({ cardsDue: dueCount, totalLearned: (progress.cards || []).length, currentLesson: progress.currentLesson });
    setActivities(generateDailySession(progress.currentLesson, dueCount, progress.kanaProgress).activities);

    const raw = localStorage.getItem('nihongo_today_completed');
    const saved = raw ? JSON.parse(raw) : { date: '', items: [] };
    if (saved.date === new Date().toISOString().split('T')[0]) setDone(new Set(saved.items));

    setRestrict(localStorage.getItem('nihongo_restrict') === 'true');
    getRestrictMode().then(setRestrict);
  }, []);

  function toggleDone(i: number) {
    const next = new Set(done);
    next.has(i) ? next.delete(i) : next.add(i);
    setDone(next);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('nihongo_today_completed', JSON.stringify({ date: today, items: [...next] }));
    if (next.size === activities.length && activities.length > 0) {
      const progress = loadProgress();
      if (!progress.completedDates.includes(today)) {
        const updated = { ...progress, completedDates: [...progress.completedDates, today] };
        saveProgress(updated);
        setStreak(getStudyStreak(updated.completedDates));
      }
    }
  }

  // Calculate current session from schedule based on today's date
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
  const today = new Date().toISOString().split('T')[0];
  const currentSession = (schedule.filter(s => s.date <= today).pop()?.session) || 1;
  const restrictUser = !isAdmin && restrict;

  return (
    <main className="min-h-screen p-4 pb-24 max-w-md mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">こんにちは! 👋</h1>
          <p className="text-sm text-gray-500">Lộ trình: Buổi {currentSession}/45</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/search" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm">🔍</Link>
          <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${streak > 0 ? 'bg-gradient-to-br from-orange-400 to-red-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
            🔥 {streak}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {!restrictUser && (
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
          <p className="text-2xl font-bold" style={{ color: '#6C63FF' }}>{stats.cardsDue}</p>
          <p className="text-[11px] text-gray-500">Cần ôn</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
          <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{stats.totalLearned}</p>
          <p className="text-[11px] text-gray-500">Đã học</p>
        </div>
        <Link href="/schedule" className="bg-white rounded-xl p-3 text-center border border-gray-100 hover:border-[#6C63FF]/30">
          <p className="text-2xl font-bold" style={{ color: '#6C63FF' }}>{currentSession}</p>
          <p className="text-[11px] text-gray-500">Buổi hôm nay</p>
        </Link>
      </div>
      )}

      {/* Bento Grid - Primary actions with hierarchy */}
      <div className="grid grid-cols-2 gap-3">
        {/* Top row - larger, core features */}
        <Link href="/schedule" className="flex flex-col items-center justify-center py-6 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 hover:shadow-md transition-all">
          <span className="text-3xl mb-2">📅</span>
          <span className="text-sm font-semibold text-gray-700">Lịch học</span>
          <span className="text-lg font-bold mt-1" style={{ color: '#6C63FF' }}>Buổi {currentSession}</span>
        </Link>
        <Link href="/review/jlpt" className="flex flex-col items-center justify-center py-6 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 hover:shadow-md transition-all">
          <span className="text-3xl mb-2">🈁</span>
          <span className="text-sm font-semibold text-gray-700">Ôn Kanji</span>
          <span className="text-xs mt-1 text-gray-400">JLPT Quiz</span>
        </Link>
        <Link href="/quiz?mode=import" className="flex flex-col items-center justify-center py-6 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 hover:shadow-md transition-all">
          <span className="text-3xl mb-2">✍️</span>
          <span className="text-sm font-semibold text-gray-700">TN Kanji theo nghĩa</span>
        </Link>
        <Link href="/schedule/quiz" className="flex flex-col items-center justify-center py-6 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 hover:shadow-md transition-all">
          <span className="text-3xl mb-2">📝</span>
          <span className="text-sm font-semibold text-gray-700">Quiz Từ vựng</span>
        </Link>
        {/* Bottom row - smaller, secondary */}
        {!restrictUser && <>
        <Link href="/lessons" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 transition-all">
          <span className="text-lg">📖</span>
          <span className="text-sm font-medium text-gray-600">Bài học</span>
        </Link>
        <Link href="/kana" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 transition-all">
          <span className="text-lg">🔤</span>
          <span className="text-sm font-medium text-gray-600">Kana</span>
        </Link>
        </>}
      </div>

      {/* Daily Tasks - collapsible */}
      {/* {!restrictUser && (
      <div>
        <button onClick={() => setShowTasks(!showTasks)} className="w-full flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">📋 Phiên học hôm nay</h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">{done.size}/{activities.length} xong</span>
            <span className="text-gray-400 text-sm">{showTasks ? '▲' : '▼'}</span>
          </div>
        </button>
        {showTasks && (
          <ul className="space-y-2">
          {activities.map((a, i) => {
            const icons = ['📖', 'あ', '📇', '✍️', '🈁', '📐'];
            const isDone = done.has(i);
            return (
              <li key={i} onClick={() => toggleDone(i)}
                className={`rounded-xl px-4 py-3 flex justify-between items-center border-2 cursor-pointer transition-all ${
                  isDone ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-[#6C63FF]/20'
                }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isDone ? 'text-white' : 'bg-gray-100 text-gray-500'
                  }`} style={isDone ? { background: '#22C55E' } : {}}>
                    {isDone ? '✓' : icons[i % icons.length]}
                  </span>
                  <span className={`text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>{a.title}</span>
                </div>
                {isDone
                  ? <span className="text-[11px] font-medium" style={{ color: '#22C55E' }}>✓ Xong</span>
                  : <span className="text-[11px] text-gray-400">{a.duration} phút ›</span>
                }
              </li>
            );
          })}
          </ul>
        )}
      </div>
      )} */}

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
