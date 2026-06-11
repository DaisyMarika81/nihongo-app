'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadProgress } from '@/lib/store';
import { vocabLessons1to10 } from '@/data/vocabulary/lessons-1-10';
import { vocabLessons11to25 } from '@/data/vocabulary/lessons-11-25';
import { vocabLessons26to40 } from '@/data/vocabulary/lessons-26-40';
import { vocabLessons41to50 } from '@/data/vocabulary/lessons-41-50';

const allVocab = [...vocabLessons1to10, ...vocabLessons11to25, ...vocabLessons26to40, ...vocabLessons41to50];

const lessonTopics: Record<number, string> = {
  1: 'Giới thiệu bản thân', 2: 'Chỉ thị từ', 3: 'Nơi chốn', 4: 'Thời gian & động từ',
  5: 'Đi lại', 6: 'Hành động', 7: 'Cho & nhận', 8: 'Tính từ',
  9: 'Sở thích', 10: 'Tồn tại', 11: 'Đếm số lượng', 12: 'So sánh',
  13: 'Mong muốn', 14: 'Thể て', 15: 'Xin phép', 16: 'Chuỗi hành động',
  17: 'Thể ない', 18: 'Thể từ điển', 19: 'Kinh nghiệm', 20: 'Thể thông thường',
  21: 'Suy nghĩ & trích dẫn', 22: 'Mệnh đề quan hệ', 23: 'Khi & nếu',
  24: 'Cho & nhận (nâng cao)', 25: 'Điều kiện', 26: 'Giải thích',
  27: 'Thể khả năng', 28: 'Thói quen', 29: 'Tự/tha động từ',
  30: 'Chuẩn bị', 31: 'Thể ý chí', 32: 'Dự đoán',
  33: 'Mệnh lệnh', 34: 'Liệt kê', 35: 'Điều kiện (ba)',
  36: 'Mục đích', 37: 'Bị động', 38: 'Danh từ hóa',
  39: 'Nguyên nhân', 40: 'Câu hỏi gián tiếp', 41: 'Nhận hành động',
  42: 'Mục đích (tame ni)', 43: 'Vẻ ngoài', 44: 'Quá mức',
  45: 'Điều kiện (nara)', 46: 'Thời điểm', 47: 'Nghe nói',
  48: 'Sai khiến', 49: 'Kính ngữ', 50: 'Khiêm nhường',
};

const cardColors = [
  'from-pink-400 to-rose-400',
  'from-orange-400 to-amber-400',
  'from-yellow-400 to-lime-400',
  'from-emerald-400 to-teal-400',
  'from-cyan-400 to-sky-400',
  'from-blue-400 to-indigo-400',
  'from-violet-400 to-purple-400',
  'from-fuchsia-400 to-pink-400',
];

export default function LessonsPage() {
  const [currentLesson, setCurrentLesson] = useState(1);
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const p = loadProgress();
    setCurrentLesson(p.currentLesson);
    setLearnedIds(new Set((p.cards || []).map((c) => c.id)));
  }, []);

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">📚 Bài học</h1>
        <button onClick={() => setUnlocked(!unlocked)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${unlocked ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
          {unlocked ? '🔓 Đã mở khóa' : '🔒 Mở tất cả'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Minna no Nihongo • 50 bài</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => {
          const locked = !unlocked && n > currentLesson + 1;
          const isCurrent = n === currentLesson;
          const words = allVocab.filter((v) => v.lesson === n);
          const learned = words.filter((w) => learnedIds.has(`vocab-${w.japanese}`)).length;
          const color = cardColors[(n - 1) % cardColors.length];
          const progress = words.length > 0 ? Math.round((learned / words.length) * 100) : 0;

          if (locked) {
            return (
              <div key={n} className="rounded-2xl p-4 bg-gray-200/60 opacity-60 cursor-not-allowed">
                <div className="text-xs text-gray-400">Bài {n}</div>
                <div className="text-sm text-gray-400 mt-1 leading-tight">{lessonTopics[n] ?? ''}</div>
                <div className="text-center mt-3 text-gray-400">🔒</div>
              </div>
            );
          }

          return (
            <Link key={n} href={`/lessons/${n}`}
              className={`relative rounded-2xl p-4 bg-gradient-to-br ${color} text-white shadow-md hover:shadow-xl hover:scale-[1.03] transition-all ${isCurrent ? 'ring-4 ring-white ring-offset-2' : ''}`}>
              <div className="text-xs font-medium opacity-80">Bài {n}</div>
              <div className="text-sm font-bold mt-1 leading-tight">{lessonTopics[n] ?? ''}</div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] opacity-80">{learned}/{words.length}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
