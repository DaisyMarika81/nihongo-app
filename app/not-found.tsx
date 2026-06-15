import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <span className="text-5xl mb-4">🔍</span>
      <h1 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy trang</h1>
      <p className="text-sm text-gray-500 mb-6">Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.</p>
      <Link
        href="/"
        className="px-6 py-2.5 text-white rounded-xl font-medium shadow"
        style={{ background: '#6C63FF' }}
      >
        Về trang chủ
      </Link>
    </div>
  );
}
