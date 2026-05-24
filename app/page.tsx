'use client';

import { useEffect, useState } from 'react';
import { loadProgress, getDueCount, saveProgress } from '@/lib/store';
import { generateDailySession, getStudyStreak, SessionActivity } from '@/lib/session';
import Link from 'next/link';

export default function Home() {
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ cardsDue: 0, totalLearned: 0, currentLesson: 1 });
  const [activities, setActivities] = useState<SessionActivity[]>([]);

  useEffect(() => {
    const progress = loadProgress();
    setStreak(getStudyStreak(progress.completedDates));
    const dueCount = getDueCount(progress);
    setStats({ cardsDue: dueCount, totalLearned: progress.cards.length, currentLesson: progress.currentLesson });
    const session = generateDailySession(progress.currentLesson, dueCount, progress.kanaProgress);
    setActivities(session.activities);

    const raw = localStorage.getItem('nihongo_today_completed');
    const saved = raw ? JSON.parse(raw) : { date: '', items: [] };
    const today = new Date().toISOString().split('T')[0];
    if (saved.date === today) setDone(new Set(saved.items));
  }, []);

  const [done, setDone] = useState<Set<number>>(new Set());

  function toggleDone(i: number) {
    const next = new Set(done);
    next.has(i) ? next.delete(i) : next.add(i);
    setDone(next);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('nihongo_today_completed', JSON.stringify({ date: today, items: [...next] }));

    // Mark day complete when all activities done → increase streak
    if (next.size === activities.length && activities.length > 0) {
      const progress = loadProgress();
      if (!progress.completedDates.includes(today)) {
        const updated = { ...progress, completedDates: [...progress.completedDates, today] };
        saveProgress(updated);
        setStreak(getStudyStreak(updated.completedDates));
      }
    }
  }

  return (
    <main className="min-h-screen p-4 pb-24 max-w-md mx-auto space-y-6">
      <Link href="/search" className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-400 shadow-sm hover:border-rose-300">
        🔍 Tìm từ vựng...
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">こんにちは! 👋</h1>
          <p className="text-sm text-gray-500">Hôm nay học gì nào?</p>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-red-400 text-white px-3 py-1 rounded-full text-sm font-bold shadow">
          🔥 {streak}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-rose-600">{stats.cardsDue}</p>
          <p className="text-xs text-rose-400 font-medium">Cần ôn</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{stats.totalLearned}</p>
          <p className="text-xs text-emerald-400 font-medium">Đã học</p>
        </div>
        <div className="bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-violet-600">{stats.currentLesson}</p>
          <p className="text-xs text-violet-400 font-medium">Bài hiện tại</p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-700 mb-3">📋 Phiên học hôm nay</h2>
        <ul className="space-y-2">
          {activities.map((a, i) => (
            <li key={i} onClick={() => toggleDone(i)}
              className={`rounded-xl px-4 py-3 flex justify-between items-center shadow-sm border cursor-pointer transition-all ${
                done.has(i) ? 'bg-emerald-50 border-emerald-200 opacity-70' : 'bg-white border-gray-100'
              }`}>
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                  done.has(i) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'
                }`}>
                  {done.has(i) && '✓'}
                </span>
                <span className={`text-sm ${done.has(i) ? 'line-through text-gray-400' : 'text-gray-700'}`}>{a.title}</span>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{a.duration} phút</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/flashcard" className="bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold py-4 rounded-2xl text-center shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
          📇 Ôn tập
        </Link>
        <Link href="/review" className="bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold py-4 rounded-2xl text-center shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
          🈁 Ôn Kanji
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/lessons" className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-semibold py-4 rounded-2xl text-center shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
          📖 Bài học
        </Link>
        <Link href="/kana" className="bg-gradient-to-r from-purple-400 to-fuchsia-500 text-white font-semibold py-4 rounded-2xl text-center shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
          🔤 Kana
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/schedule" className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold py-4 rounded-2xl text-center shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
          📅 Lịch học
        </Link>
      </div>

      <Link href="/settings" className="block text-center text-sm text-gray-400 hover:text-gray-600 py-2">
        ⚙️ Cài đặt
      </Link>
      <Link href="/tips" className="block text-center text-sm text-gray-400 hover:text-gray-600 py-2">
        💡 Mẹo học tập
      </Link>
      <Link href="/upload" className="block text-center text-sm text-gray-400 hover:text-gray-600 py-2">
        📤 Upload từ vựng
      </Link>
    </main>
  );
}
