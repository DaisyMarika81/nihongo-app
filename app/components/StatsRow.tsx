import Link from 'next/link';

export default function StatsRow({ cardsDue, totalLearned, currentSession }: { cardsDue: number; totalLearned: number; currentSession: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
        <p className="text-2xl font-bold" style={{ color: '#6C63FF' }}>{cardsDue}</p>
        <p className="text-[11px] text-gray-500">Cần ôn</p>
      </div>
      <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
        <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{totalLearned}</p>
        <p className="text-[11px] text-gray-500">Đã học</p>
      </div>
      <Link href="/schedule" className="bg-white rounded-xl p-3 text-center border border-gray-100 hover:border-[#6C63FF]/30">
        <p className="text-2xl font-bold" style={{ color: '#6C63FF' }}>{currentSession}</p>
        <p className="text-[11px] text-gray-500">Buổi hôm nay</p>
      </Link>
    </div>
  );
}
