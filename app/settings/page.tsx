'use client';

import { useState, useEffect } from 'react';
import { loadProgress, saveProgress, Progress } from '@/lib/store';

export default function SettingsPage() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => { setProgress(loadProgress()); }, []);

  const resetProgress = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ tiến trình?')) {
      localStorage.removeItem('nihongo_progress');
      localStorage.removeItem('nihongo_kana_mastered');
      setProgress(loadProgress());
    }
  };

  const exportData = () => {
    const data = JSON.stringify(progress, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nihongo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Progress;
        saveProgress(data);
        setProgress(data);
        alert('Import thành công!');
      } catch { alert('File không hợp lệ'); }
    };
    reader.readAsText(file);
  };

  if (!progress) return null;

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Cài đặt</h1>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3">📊 Thống kê</h2>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Bài học hiện tại: <span className="text-gray-800 font-medium">{progress.currentLesson}/50</span></p>
            <p>Tổng thẻ đã học: <span className="text-gray-800 font-medium">{progress.cards.length}</span></p>
            <p>Tổng lượt ôn tập: <span className="text-gray-800 font-medium">{progress.totalReviews}</span></p>
            <p>Kana: <span className="text-gray-800 font-medium">{progress.kanaProgress}%</span></p>
            <p>Ngày đã học: <span className="text-gray-800 font-medium">{progress.completedDates.length}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3">💾 Dữ liệu</h2>
          <div className="space-y-3">
            <button onClick={exportData} className="w-full py-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl text-sm font-medium shadow">
              📤 Export backup
            </button>
            <label className="block w-full py-3 bg-gray-100 rounded-xl text-sm font-medium text-center cursor-pointer text-gray-600 hover:bg-gray-200 transition">
              📥 Import backup
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <h2 className="font-semibold text-red-500 mb-3">⚠️ Vùng nguy hiểm</h2>
          <button onClick={resetProgress} className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition border border-red-200">
            🗑️ Xóa toàn bộ tiến trình
          </button>
        </div>
      </div>
    </div>
  );
}
