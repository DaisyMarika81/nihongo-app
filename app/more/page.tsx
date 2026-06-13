'use client';

import Link from 'next/link';

const features = [
  { href: '/lessons', icon: '📖', title: 'Bài học', desc: 'Danh sách bài học theo buổi' },
  { href: '/chat', icon: '🤖', title: 'AI', desc: 'Trò chuyện với AI hỗ trợ học' },
  { href: '/practice', icon: '🎯', title: 'Luyện tập', desc: 'Luyện tập các dạng bài' },
  { href: '/kanji', icon: '🈁', title: 'Kanji', desc: 'Tra cứu và học kanji' },
  { href: '/quiz', icon: '✍️', title: 'Quiz', desc: 'Trắc nghiệm kiến thức' },
];

export default function MorePage() {
  return (
    <main className="min-h-screen p-4 pb-24 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Quay lại</Link>
      </div>
      <h1 className="text-xl font-bold text-gray-800">📎 Chức năng phụ</h1>
      <div className="space-y-3">
        {features.map(f => (
          <Link key={f.href} href={f.href}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-[#6C63FF]/30 hover:shadow-md transition-all">
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className="font-semibold text-gray-700">{f.title}</p>
              <p className="text-xs text-gray-400">{f.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
