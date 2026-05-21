'use client';

import Link from 'next/link';

export default function TipsPage() {
  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">💡 Mẹo học từ vựng</h1>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-bold text-lg text-indigo-600 mb-3">📄 Phương pháp giấy A4 (4 cột)</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <p><strong>Sáng:</strong> Đọc qua từ mới, ghi nhớ khái quát nghĩa → <em>Xem Flashcard</em></p>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <p><strong>Trưa:</strong> Nhìn từ JP → viết nghĩa VN theo trí nhớ, check sai đánh X → <em>Quiz JP→VN</em></p>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <p><strong>Tối:</strong> Nhìn nghĩa VN → viết lại từ JP, check sai đánh X → <em>Quiz VN→JP</em></p>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <p><strong>Sáng hôm sau:</strong> Nhìn từ JP → viết nghĩa VN lần cuối → <em>Kiểm tra lại</em></p>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">★</span>
            <p><strong>T7 + CN:</strong> Tổng kết tuần, ôn lại từ sai (chép riêng)</p>
          </div>
        </div>
      </div>

      <Link href="/schedule/1/a4method" className="block w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-center font-medium shadow-md hover:shadow-lg transition-all">
        🚀 Bắt đầu phương pháp A4 — Buổi 1
      </Link>
    </div>
  );
}
