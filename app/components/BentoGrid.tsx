import Link from 'next/link';

const tile =
  'flex flex-col items-center justify-center py-6 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#6C63FF]/30 hover:shadow-md transition-all';

export default function BentoGrid({
  currentSession,
  restrictUser,
}: {
  currentSession: number;
  restrictUser: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Lịch + ôn chính */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href="/schedule" className={tile}>
          <span className="text-3xl mb-2" aria-hidden>
            📅
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">Lịch học</span>
          <span className="text-lg font-bold mt-1" style={{ color: '#6C63FF' }}>
            Buổi {currentSession}
          </span>
        </Link>
        <Link href="/review/jlpt" className={tile}>
          <span className="text-3xl mb-2" aria-hidden>
            🈁
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">Ôn Kanji</span>
          <span className="text-xs mt-1 text-gray-400">JLPT Quiz</span>
        </Link>
        <Link href="/quiz?mode=import" className={tile}>
          <span className="text-3xl mb-2" aria-hidden>
            ✍️
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">TN Kanji theo nghĩa</span>
        </Link>
        <Link href="/schedule/quiz" className={tile}>
          <span className="text-3xl mb-2" aria-hidden>
            📝
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">Quiz Từ vựng</span>
        </Link>
        {!restrictUser && (
          <>
            <Link href="/lessons" className={tile}>
              <span className="text-3xl mb-2" aria-hidden>
                📖
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">Bài học</span>
            </Link>
            <Link href="/kana" className={tile}>
              <span className="text-3xl mb-2" aria-hidden>
                🔤
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">Kana</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
