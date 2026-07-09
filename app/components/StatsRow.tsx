import Link from 'next/link';

export default function StatsRow({
  cardsDue,
  totalLearned,
  currentSession,
  isClassToday = false,
  ready = true,
}: {
  cardsDue: number;
  totalLearned: number;
  currentSession: number;
  isClassToday?: boolean;
  ready?: boolean;
}) {
  const cardCls =
    'bg-white dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700 hover:border-[#6C63FF]/30 transition-all block';

  if (!ready) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700 animate-pulse"
          >
            <div className="h-8 w-10 mx-auto rounded bg-gray-100 dark:bg-gray-700 mb-1" />
            <div className="h-3 w-12 mx-auto rounded bg-gray-50 dark:bg-gray-700/60" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <Link href="/review" className={cardCls} title="Thẻ SRS đến hạn ôn">
        <p className="text-2xl font-bold" style={{ color: '#6C63FF' }}>
          {cardsDue}
        </p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Cần ôn</p>
      </Link>
      <div className={`${cardCls} hover:border-gray-100 dark:hover:border-gray-700 cursor-default`} title="Tổng thẻ đã đưa vào SRS">
        <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>
          {totalLearned}
        </p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Đã học</p>
      </div>
      <Link
        href="/schedule"
        className={cardCls}
        title={isClassToday ? 'Hôm nay có buổi học' : 'Buổi lộ trình hiện tại (theo lịch VN)'}
      >
        <p className="text-2xl font-bold" style={{ color: '#6C63FF' }}>
          {currentSession}
        </p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          {isClassToday ? 'Buổi hôm nay' : 'Buổi hiện tại'}
        </p>
      </Link>
    </div>
  );
}
