'use client';

import { useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { addSessionData, SessionDataType } from '@/lib/session-data';

const TEMPLATES: Record<SessionDataType, string> = {
  flashcard: `[
  { "kanji": "", "hiragana": "", "romaji": "", "meaning": "", "examples": [], "antonym": {} }
]`,
  grammar: `[
  {
    "pattern": "",
    "connections": [
      { "type": "V-る", "note": "" },
      { "type": "V-ない", "note": "" }
    ],
    "meaning": "",
    "details": {
      "nature": "",
      "exception": "",
      "tense_distinction": [""]
    },
    "example": "",
    "exampleRomaji": "",
    "exampleMeaning": "",
    "note": "",
    "usages": [
      {
        "label": "Cách dùng 1",
        "meaning": "",
        "pattern": "",
        "example": "",
        "exampleMeaning": "",
        "exampleHiragana": "",
        "note": ""
      }
    ]
  }
]`,
  kanji: `[
  {
    "kanji": "",
    "hanViet": "",
    "meaning": "",
    "onyomi": "",
    "kunyomi": "",
    "mnemonic": "",
    "vocab": [
      { "word": "", "reading": "", "meaning": "", "highlight": "", "highlightMeaning": "", "highlightReading": "" }
    ]
  }
]`
};

const EXAMPLES: Record<SessionDataType, string> = {
  flashcard: `[
  {
    "kanji": "高齢",
    "hiragana": "こうれい",
    "romaji": "kourei",
    "meaning": "Già, cao tuổi",
    "examples": [
      {
        "japanese": "祖母は高齢だがまだとても元気だ。",
        "hiragana": "そぼはこうれいだがまだとてもげんきだ。",
        "romaji": "sobo wa kourei da ga mada totemo genki da.",
        "meaning_vi": "Bà tôi tuy đã cao tuổi nhưng vẫn còn rất khỏe mạnh."
      }
    ]
  },
  {
    "kanji": "先輩",
    "hiragana": "せんぱい",
    "romaji": "senpai",
    "meaning": "Tiền bối, đàn anh/đàn chị",
    "antonym": {
      "kanji": "後輩",
      "hiragana": "こうはい",
      "romaji": "kouhai",
      "meaning": "Hậu bối, đàn em"
    }
  }
]`,
  grammar: `[
  {
    "pattern": "～ことにしている",
    "connections": [
      { "type": "V-る", "note": "" },
      { "type": "V-ない", "note": "" }
    ],
    "meaning": "Cố gắng/Quyết tâm (thói quen chủ quan)",
    "details": {
      "nature": "Diễn tả thói quen mang tính CHỦ QUAN do ý chí bản thân tự đặt ra",
      "exception": "Không dùng cho thói quen hiển nhiên/tự nhiên",
      "tense_distinction": [
        "「～ことにする」: Quyết định ngay tại thời điểm nói",
        "「～ことにした」: Nhấn mạnh thời điểm đã quyết định",
        "「～ことにしている」: Hành động đã thành thói quen"
      ]
    },
    "example": {
      "japanese": "毎日、寝る前に、リキアプリでのビデオを見ることにしている。",
      "romaji": "Mainichi, neru mae ni, riki apuri de no bideo wo miru koto ni shite iru.",
      "hiragana": "まいにち、ねるまえに、りきあぷりでのびでおをみることにしている。",
      "vietnamese": "Mỗi ngày, trước khi ngủ, tôi đều xem video trên Riki."
    },
    "usages": [
      {
        "label": "Cách dùng 1",
        "meaning": "Hành động có chủ ý trở thành thói quen",
        "pattern": "V-る + ことにしている",
        "example": "毎日、ジョギングをすることにしている。",
        "exampleMeaning": "Tôi đặt quyết tâm chạy bộ mỗi ngày.",
        "exampleHiragana": "なつにゆきがふるはずがない",
        "note": "Thường dùng với động từ chỉ hành động có chủ đích"
      },
      {
        "label": "Cách dùng 2",
        "meaning": "Không làm gì đó như một nguyên tắc",
        "pattern": "V-ない + ことにしている",
        "example": "夜遅く、コーヒーを飲まないことにしている。",
        "exampleMeaning": "Tôi không uống cà phê vào tối muộn.",
        "exampleHiragana": "なつにゆきがふるはずがない",
        "note": "Dạng phủ định của thói quen"
      }
    ]
  }
]`,
  kanji: `[
  {
    "kanji": "術",
    "hanViet": "THUẬT",
    "meaning": "Kĩ thuật",
    "onyomi": "ジュツ",
    "kunyomi": "",
    "mnemonic": "Đi (行) trên con đường **kĩ thuật**",
    "vocab": [
      { "word": "新しい技術を学ぶ", "reading": "あたらしいぎじゅつをまなぶ", "meaning": "Học kĩ thuật mới", "highlight": "技術", "highlightMeaning": "kĩ thuật", "highlightReading": "ぎじゅつ" }
    ]
  }
]`
};

export default function UploadPage() {
  return <Suspense><UploadContent /></Suspense>;
}

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const sessionFromUrl = searchParams.get('session') || '1';
  const [json, setJson] = useState('');
  const [type, setType] = useState<SessionDataType>('kanji');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading2, setLoading2] = useState(false);
  const [showExample, setShowExample] = useState(false);

  if (!loading && !isAdmin) { router.replace('/'); return null; }

  // Real-time validation
  const validation = useCallback((): { valid: boolean; error?: string; count?: number } => {
    if (!json.trim()) return { valid: false };
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) return { valid: false, error: 'JSON phải là mảng [...]' };
      if (!parsed.length) return { valid: false, error: 'Mảng rỗng' };
      return { valid: true, count: parsed.length };
    } catch (e) {
      const msg = (e as Error).message;
      const match = msg.match(/position (\d+)/);
      return { valid: false, error: match ? `Lỗi cú pháp tại vị trí ${match[1]}` : msg };
    }
  }, [json]);

  const v = validation();

  function switchType(t: SessionDataType) {
    setType(t);
    if (!json.trim()) setJson(TEMPLATES[t]);
    setStatus(null);
  }

  async function handleUpload() {
    if (!v.valid) return;
    try {
      setLoading2(true);
      const items = JSON.parse(json);
      await addSessionData(parseInt(sessionFromUrl), type, items);
      setStatus({ type: 'success', msg: `✅ Đã lưu ${items.length} mục ${type} vào Buổi ${sessionFromUrl}` });
      setJson('');
    } catch (e: unknown) {
      setStatus({ type: 'error', msg: `❌ ${(e as Error).message}` });
    } finally {
      setLoading2(false);
    }
  }

  // Line numbers
  const lineCount = json.split('\n').length;

  return (
    <div className="min-h-screen p-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800 mb-1">📤 Upload dữ liệu</h1>
      <p className="text-sm text-gray-500 mb-4">
        Dữ liệu sẽ được thêm vào: <span className="font-medium text-gray-700">Lịch học › Buổi {sessionFromUrl}</span>
      </p>

      {/* Type selector */}
      <div className="flex items-center gap-2 mb-4">
        {(['flashcard', 'grammar', 'kanji'] as const).map(t => (
          <button key={t} onClick={() => switchType(t)}
            className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${type === t ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={type === t ? { background: '#6C63FF' } : {}}>
            {t === 'flashcard' ? '🃏 Flashcard' : t === 'grammar' ? '📐 Ngữ pháp' : '🈁 Kanji'}
          </button>
        ))}
      </div>

      {/* Code editor area */}
      <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            {v.valid && <span className="text-[11px] font-medium" style={{ color: '#22C55E' }}>✓ JSON hợp lệ • {v.count} mục</span>}
            {v.error && <span className="text-[11px] font-medium text-red-500">✗ {v.error}</span>}
            {!json.trim() && <span className="text-[11px] text-gray-400">Nhập JSON mảng...</span>}
          </div>
          <button onClick={() => setShowExample(!showExample)} className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100">
            ? Xem mẫu
          </button>
        </div>

        {/* Example modal */}
        {showExample && (
          <div className="px-3 py-2 border-b border-gray-100 bg-amber-50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-amber-700">Mẫu {type}:</span>
              <div className="flex gap-2">
                <button onClick={() => { setJson(EXAMPLES[type]); setShowExample(false); }} className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-medium">Dùng mẫu này</button>
                <button onClick={() => setShowExample(false)} className="text-[10px] text-amber-600">✕</button>
              </div>
            </div>
            <pre className="text-[10px] text-amber-800 font-mono overflow-x-auto whitespace-pre">{EXAMPLES[type]}</pre>
          </div>
        )}

        {/* Editor with line numbers */}
        <div className="flex">
          <div className="py-3 px-2 bg-gray-50 border-r border-gray-100 select-none">
            {Array.from({ length: Math.max(lineCount, 10) }, (_, i) => (
              <div key={i} className="text-[10px] text-gray-300 text-right leading-5 w-6">{i + 1}</div>
            ))}
          </div>
          <textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); setStatus(null); }}
            placeholder={TEMPLATES[type]}
            className="flex-1 px-3 py-3 font-mono text-xs leading-5 focus:outline-none resize-y min-h-[280px] bg-transparent"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Status */}
      {status && (
        <p className={`mt-3 text-sm ${status.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>{status.msg}</p>
      )}

      {/* Save button */}
      <button onClick={handleUpload} disabled={loading2 || !v.valid}
        className={`mt-4 w-full py-3 rounded-xl font-medium shadow transition-all ${v.valid ? 'text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        style={v.valid ? { background: '#6C63FF' } : {}}>
        {loading2 ? '⏳ Đang lưu...' : `💾 Lưu vào Buổi ${sessionFromUrl}`}
      </button>
    </div>
  );
}
