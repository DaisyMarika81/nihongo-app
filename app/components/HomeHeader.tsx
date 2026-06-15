import Link from 'next/link';

export default function HomeHeader({ streak, currentSession }: { streak: number; currentSession: number }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">こんにちは! 👋</h1>
        <p className="text-sm text-gray-500">Lộ trình: Buổi {currentSession}/45</p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/search" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm">🔍</Link>
        <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${streak > 0 ? 'bg-gradient-to-br from-orange-400 to-red-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
          🔥 {streak}
        </div>
      </div>
    </div>
  );
}
