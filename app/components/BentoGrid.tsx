import Link from 'next/link';

export default function BentoGrid({ currentSession, restrictUser }: { currentSession: number; restrictUser: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
  );
}
