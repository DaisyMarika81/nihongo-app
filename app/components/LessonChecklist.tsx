'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_CHECKLIST, getCheckedItems, toggleCheckItem } from '@/lib/checklist';

export default function LessonChecklist({ lessonId }: { lessonId: number }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => { setChecked(getCheckedItems(lessonId)); }, [lessonId]);

  const progress = Math.round((checked.size / DEFAULT_CHECKLIST.length) * 100);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700">✅ Checklist buổi học</h3>
        <span className="text-xs text-gray-400">{checked.size}/{DEFAULT_CHECKLIST.length}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <ul className="space-y-2">
        {DEFAULT_CHECKLIST.map((item) => (
          <li key={item.id}>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={checked.has(item.id)}
                onChange={() => setChecked(toggleCheckItem(lessonId, item.id))}
                className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-300"
              />
              <span className={`text-sm transition-all ${checked.has(item.id) ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-indigo-600'}`}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {progress === 100 && <p className="mt-3 text-center text-sm text-emerald-600 font-medium">🎉 Hoàn thành buổi học!</p>}
    </div>
  );
}
