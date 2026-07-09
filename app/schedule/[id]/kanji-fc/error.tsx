'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { deleteAllSessionData } from '@/lib/session-data';

export default function KanjiFcError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { id } = useParams();
  const sessionId = parseInt(String(id), 10);
  const { isAdmin } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleDelete = async () => {
    if (!isAdmin || !Number.isFinite(sessionId)) return;
    setDeleting(true);
    try {
      await deleteAllSessionData(sessionId, 'kanji');
      setDeleted(true);
    } catch {
      /* ignore */
    }
    setDeleting(false);
  };

  const backHref = Number.isFinite(sessionId) ? `/schedule/${sessionId}` : '/schedule';
  const reloadHref = Number.isFinite(sessionId) ? `/schedule/${sessionId}/kanji-fc` : '/schedule';

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-5">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold text-red-600">Lỗi dữ liệu Kanji</h1>
        <p className="text-sm text-gray-500 break-words">{error.message}</p>

        {deleted ? (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">Đã xóa dữ liệu kanji cloud của buổi {sessionId}.</p>
            <Link
              href={reloadHref}
              className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              Tải lại trang
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              Thử lại
            </button>
            {isAdmin && Number.isFinite(sessionId) && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full px-5 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 border border-red-200 disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : `Xóa dữ liệu kanji cloud buổi ${sessionId}`}
              </button>
            )}
            <Link href={backHref} className="block text-sm text-gray-400 hover:text-gray-600">
              Quay lại buổi học
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
