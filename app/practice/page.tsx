'use client';

import Link from 'next/link';

const practices = [
  { href: '/practice/write', icon: '✍️', title: 'Luyện viết Kanji', desc: 'Vẽ kanji trên canvas' },
  { href: '/practice/listen', icon: '👂', title: 'Nghe & Chọn', desc: 'Luyện nghe phát âm' },
  { href: '/practice/sentence', icon: '🧩', title: 'Ghép câu', desc: 'Sắp xếp từ thành câu' },
  { href: '/practice/conjugation', icon: '🔄', title: 'Chia động từ', desc: 'ます→て→ない→た' },
  { href: '/review/jlpt', icon: '📝', title: 'JLPT Kanji Quiz', desc: '問題2 & 問題3 (35 câu)' },
  { href: '/bookmarks', icon: '⭐', title: 'Từ khó', desc: 'Ôn từ đã đánh dấu' },
];

export default function PracticePage() {
  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🎯 Luyện tập</h1>
      <p className="text-sm text-gray-500 mb-6">Chọn bài luyện</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {practices.map((p) => (
          <Link key={p.href} href={p.href}
            className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all">
            <span className="text-3xl">{p.icon}</span>
            <div>
              <div className="font-semibold text-gray-800">{p.title}</div>
              <div className="text-xs text-gray-500">{p.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
