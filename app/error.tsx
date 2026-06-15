'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <span className="text-5xl mb-4">😵</span>
      <h1 className="text-xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">{error.message || 'Đã xảy ra lỗi không mong muốn.'}</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 text-white rounded-xl font-medium shadow"
        style={{ background: '#6C63FF' }}
      >
        Thử lại
      </button>
    </div>
  );
}
