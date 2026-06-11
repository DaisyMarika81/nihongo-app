'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { sessionCards } from '@/data/session-cards';
import { getAllSessionData } from '@/lib/session-data';

export default function TipsPage() {
  const [session, setSession] = useState(1);
  const [hasData, setHasData] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    const data = new Set<number>();
    for (let i = 1; i <= 45; i++) {
      if (sessionCards[i]?.length) data.add(i);
    }
    getAllSessionData().then(cloud => {
      cloud.filter(c => c.type === 'flashcard' && c.count > 0).forEach(c => data.add(c.session_num));
      setHasData(new Set(data));
    });
    const done = new Set<number>();
    for (let i = 1; i <= 45; i++) {
      const raw = localStorage.getItem(`nihongo_session${i}_state`);
      if (raw) {
        const { done: d } = JSON.parse(raw);
        if (d && d.length > 0) done.add(i);
      }
    }
    setCompleted(done);
  }, []);

  const currentHasData = hasData.has(session);

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">💡 Mẹo học từ vựng</h1>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-bold text-lg text-indigo-600">📄 Phương pháp giấy A4 (4 cột)</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setSession(Math.max(1, session - 1))}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-200">◀</button>
            <span className="text-sm font-bold text-gray-700 min-w-[4ch] text-center">Buổi {session}</span>
            <button onClick={() => setSession(Math.min(45, session + 1))}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-200">▶</button>
          </div>
        </div>
        <div className="space-y-4 text-sm text-gray-600 mt-4">
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <p><strong>Sáng:</strong> Đọc qua từ mới, ghi nhớ khái quát nghĩa</p>
              <p className="text-indigo-500 font-medium italic text-xs mt-0.5">→ Xem Flashcard</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <p><strong>Trưa:</strong> Nhìn từ JP → viết nghĩa VN theo trí nhớ, check sai đánh X</p>
              <p className="text-indigo-500 font-medium italic text-xs mt-0.5">→ Quiz JP→VN</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <p><strong>Tối:</strong> Nhìn nghĩa VN → viết lại từ JP, check sai đánh X</p>
              <p className="text-indigo-500 font-medium italic text-xs mt-0.5">→ Quiz VN→JP</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <div>
              <p><strong>Sáng hôm sau:</strong> Nhìn từ JP → viết nghĩa VN lần cuối</p>
              <p className="text-indigo-500 font-medium italic text-xs mt-0.5">→ Kiểm tra lại</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">★</span>
            <div>
              <p><strong>T7 + CN:</strong> Tổng kết tuần, ôn lại từ sai (chép riêng)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-800 mb-3">📂 Chọn buổi học</h3>
        <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pb-1">
          {Array.from({ length: 45 }, (_, i) => {
            const n = i + 1;
            const isSelected = n === session;
            const isDone = completed.has(n);
            const active = hasData.has(n);
            if (!active) {
              return (
                <span key={n} className="w-10 h-10 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center bg-gray-100 text-gray-300 cursor-not-allowed">
                  {n}
                </span>
              );
            }
            return (
              <button key={n} onClick={() => setSession(n)}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-500 text-white shadow-md'
                    : isDone
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}>
                {isDone ? '✓' : n}
              </button>
            );
          })}
        </div>
        {currentHasData ? (
          <Link href={`/schedule/${session}/a4method`}
            className="mt-4 block w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-center font-medium shadow-md hover:shadow-lg transition-all">
            🚀 Bắt đầu phương pháp A4 — Buổi {session}
          </Link>
        ) : (
          <div className="mt-4 w-full py-3 bg-gray-200 text-gray-400 rounded-xl text-center font-medium cursor-not-allowed">
            📭 Buổi {session} chưa có dữ liệu — Upload flashcard trước
          </div>
        )}
      </div>
    </div>
  );
}
