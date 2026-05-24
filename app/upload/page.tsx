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
      if (!data.session || !data.type) throw new Error('Cần có "session" và "type" (flashcard/grammar/kanji)');

      const keyMap: Record<string, string> = {
        flashcard: `nihongo_custom_flashcard_${data.session}`,
        grammar: `nihongo_custom_grammar_${data.session}`,
        kanji: `nihongo_custom_kanji_${data.session}`,
      };
      const key = keyMap[data.type];
      if (!key) throw new Error('type phải là: flashcard, grammar, hoặc kanji');

      localStorage.setItem(key, JSON.stringify(data));
      const count = data.cards?.length || data.items?.length || 0;
      setStatus({ type: 'success', msg: `✅ Đã lưu ${data.type} buổi ${data.session} (${count} mục)` });
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: `❌ Lỗi: ${(e as Error).message}` });
    }
  }

  function loadExample(type: 'flashcard' | 'grammar' | 'kanji') {
    const templates: Record<string, string> = {
      flashcard: EXAMPLE_FLASHCARD,
      grammar: EXAMPLE_GRAMMAR,
      kanji: `{\n  "session": ${sessionFromUrl},\n  "type": "kanji",\n  "cards": [\n    {\n      "kanji": "任",\n      "hanViet": "NHIỆM",\n      "meaning": "Giao phó",\n      "onyomi": "ニン",\n      "kunyomi": "まか(せる)",\n      "vocab": [\n        { "word": "責任", "reading": "せきにん", "meaning": "Trách nhiệm" },\n        { "word": "担任の先生", "reading": "たんにんのせんせい", "meaning": "Giáo viên chủ nhiệm" }\n      ]\n    }\n  ]\n}`,
    };
    setJson(templates[type].replace(/SESSION_NUM/g, sessionFromUrl));
    setStatus(null);
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📤 Upload — Buổi {sessionFromUrl}</h1>
      <p className="text-sm text-gray-500 mb-4">Paste JSON để thêm flashcard hoặc ngữ pháp cho mỗi buổi học</p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => loadExample('flashcard')} className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg font-medium">📋 Mẫu Flashcard</button>
        <button onClick={() => loadExample('grammar')} className="text-xs px-3 py-1.5 bg-violet-100 text-violet-600 rounded-lg font-medium">📋 Mẫu Ngữ pháp</button>
        <button onClick={() => loadExample('kanji')} className="text-xs px-3 py-1.5 bg-rose-100 text-rose-600 rounded-lg font-medium">📋 Mẫu Kanji</button>
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
