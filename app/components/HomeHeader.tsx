import Link from 'next/link';

export default function HomeHeader({
  streak,
  currentSession,
  totalSessions = 45,
  greeting = 'こんにちは',
}: {
  streak: number;
  currentSession: number;
  totalSessions?: number;
  greeting?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {greeting}! 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lộ trình: Buổi {currentSession}/{totalSessions}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/search"
          aria-label="Tìm kiếm"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
        >
          🔍
        </Link>
        <div
          className={`px-3 py-1.5 rounded-full text-sm font-bold ${
            streak > 0
              ? 'bg-gradient-to-br from-orange-400 to-red-400 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}
          title={streak > 0 ? `${streak} ngày streak` : 'Học hôm nay để bắt đầu streak'}
        >
          🔥 {streak}
        </div>
      </div>
    </div>
  );
}
