'use client';

import { useEffect, useState } from 'react';
import { loadProgress, getDueCount, saveProgress } from '@/lib/store';
import { generateDailySession, getStudyStreak, SessionActivity } from '@/lib/session';
import Link from 'next/link';

export default function Home() {
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ cardsDue: 0, totalLearned: 0, currentLesson: 1 });
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [showTasks, setShowTasks] = useState(false);

  useEffect(() => {
    const progress = loadProgress();
    setStreak(getStudyStreak(progress.completedDates));
    const dueCount = getDueCount(progress);
    setStats({ cardsDue: dueCount, totalLearned: progress.cards.length, currentLesson: progress.currentLesson });
    setActivities(generateDailySession(progress.currentLesson, dueCount, progress.kanaProgress).activities);

    const raw = localStorage.getItem('nihongo_today_completed');
    const saved = raw ? JSON.parse(raw) : { date: '', items: [] };
    if (saved.date === new Date().toISOString().split('T')[0]) setDone(new Set(saved.items));
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

  // Calculate current session from schedule
  const currentSession = Math.min(6, 45); // TODO: derive from date

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

      {/* Bento Grid - Primary actions with hierarchy */}
      <div className="grid grid-cols-2 gap-3">
        {/* Top row - larger, core features */}
        <Link href="/schedule" className="flex flex-col items-center justify-center py-6 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 hover:shadow-md transition-all">
          <span className="text-3xl mb-2">📅</span>
          <span className="text-sm font-semibold text-gray-700">Lịch học</span>
          <span className="text-lg font-bold mt-1" style={{ color: '#6C63FF' }}>Buổi {currentSession}</span>
        </Link>
        <Link href="/review" className="flex flex-col items-center justify-center py-6 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 hover:shadow-md transition-all">
          <span className="text-3xl mb-2">🈁</span>
          <span className="text-sm font-semibold text-gray-700">Ôn Kanji</span>
          <span className="text-xs mt-1 text-gray-400">JLPT Quiz</span>
        </Link>
        {/* Bottom row - smaller, secondary */}
        <Link href="/lessons" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 transition-all">
          <span className="text-lg">📖</span>
          <span className="text-sm font-medium text-gray-600">Bài học</span>
        </Link>
        <Link href="/kana" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 transition-all">
          <span className="text-lg">🔤</span>
          <span className="text-sm font-medium text-gray-600">Kana</span>
        </Link>
      </div>

      {/* Daily Tasks - collapsible */}
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

      {/* Secondary links */}
      <div className="flex gap-3">
        <Link href="/flashcard" className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 py-2 rounded-xl border border-gray-100 bg-white">📇 Ôn tập</Link>
        <Link href="/settings" className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 py-2 rounded-xl border border-gray-100 bg-white">⚙️ Cài đặt</Link>
        <Link href="/tips" className="flex-1 text-center text-xs text-gray-400 hover:text-gray-600 py-2 rounded-xl border border-gray-100 bg-white">💡 Mẹo</Link>
      </div>
    </main>
  );
}
