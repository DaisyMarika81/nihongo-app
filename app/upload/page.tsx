'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const EXAMPLE_FLASHCARD = `{
  "session": SESSION_NUM,
  "type": "flashcard",
  "cards": [
    { "japanese": "たべます", "vietnamese": "Ăn" },
    { "japanese": "のみます", "vietnamese": "Uống" }
  ]
}`;

const EXAMPLE_GRAMMAR = `{
  "session": SESSION_NUM,
  "type": "grammar",
  "items": [
    {
      "pattern": "Vて + います",
      "meaning": "Đang làm V (trạng thái tiếp diễn)",
      "example": "今 本を 読んでいます。",
      "exampleRomaji": "Ima hon wo yonde imasu.",
      "exampleMeaning": "Bây giờ tôi đang đọc sách.",
      "note": "Dùng cho hành động đang diễn ra"
    }
  ]
}`;

export default function UploadPage() {
  return <Suspense><UploadContent /></Suspense>;
}

function UploadContent() {
  const searchParams = useSearchParams();
  const sessionFromUrl = searchParams.get('session') || '1';
  const [json, setJson] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  function handleUpload() {
    try {
      const data = JSON.parse(json);
      if (!data.session || !data.type) throw new Error('Cần có "session" và "type"');

      const key = data.type === 'flashcard'
        ? `nihongo_custom_flashcard_${data.session}`
        : `nihongo_custom_grammar_${data.session}`;

      localStorage.setItem(key, JSON.stringify(data));
      setStatus({ type: 'success', msg: `✅ Đã lưu ${data.type} buổi ${data.session} (${data.type === 'flashcard' ? data.cards?.length : data.items?.length} mục)` });
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: `❌ Lỗi: ${(e as Error).message}` });
    }
  }

  function loadExample(type: 'flashcard' | 'grammar') {
    const tmpl = type === 'flashcard' ? EXAMPLE_FLASHCARD : EXAMPLE_GRAMMAR;
    setJson(tmpl.replace(/SESSION_NUM/g, sessionFromUrl));
    setStatus(null);
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📤 Upload — Buổi {sessionFromUrl}</h1>
      <p className="text-sm text-gray-500 mb-4">Paste JSON để thêm flashcard hoặc ngữ pháp cho mỗi buổi học</p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => loadExample('flashcard')} className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg font-medium">📋 Mẫu Flashcard</button>
        <button onClick={() => loadExample('grammar')} className="text-xs px-3 py-1.5 bg-violet-100 text-violet-600 rounded-lg font-medium">📋 Mẫu Ngữ pháp</button>
      </div>

      <textarea
        value={json}
        onChange={(e) => { setJson(e.target.value); setStatus(null); }}
        placeholder="Paste JSON vào đây..."
        className="w-full h-64 px-4 py-3 border border-gray-200 rounded-xl bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
      />

      {status && (
        <p className={`mt-2 text-sm ${status.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>{status.msg}</p>
      )}

      <button onClick={handleUpload} className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow">
        💾 Lưu
      </button>

      <div className="mt-8">
        <h2 className="font-bold text-gray-700 mb-2">📖 Cấu trúc JSON</h2>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs font-mono space-y-4">
          <div>
            <p className="text-indigo-600 font-bold mb-1">Flashcard:</p>
            <pre className="whitespace-pre-wrap text-gray-600">{EXAMPLE_FLASHCARD}</pre>
          </div>
          <div>
            <p className="text-violet-600 font-bold mb-1">Ngữ pháp:</p>
            <pre className="whitespace-pre-wrap text-gray-600">{EXAMPLE_GRAMMAR}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
