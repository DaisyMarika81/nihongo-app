'use client';

import React, { useState } from 'react';

const kanjiReadings: Record<string, string> = {
  '会': 'あ', '待': 'ま', '帰': 'かえ', '飲': 'の', '遊': 'あそ',
  '死': 'し', '書': 'か', '働': 'はたら', '泳': 'およ', '話': 'はな',
  '食': 'た', '見': 'み', '寝': 'ね', '行': 'い', '買': 'か',
  '起': 'お', '入': 'はい',
};

function renderRuby(text: string): React.ReactNode[] {
  const chars = [...text];
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (kanjiReadings[ch]) {
      parts.push(<ruby key={i}>{ch}<rt>{kanjiReadings[ch]}</rt></ruby>);
    } else {
      parts.push(<span key={i}>{ch}</span>);
    }
    i++;
  }
  return parts;
}

type FormDef = {
  id: string;
  label: string;
  group1: string;
  group2: string;
  group3: string;
  examples: { label: string; g1: string; g2: string; g3: string; note?: string }[];
  exceptions: { verb: string; correct: string; wrong?: string; note: string }[];
  tip?: string;
};

const ichidanSpecials = [
  { verb: 'います', dict: 'いる', romaji: 'iru', meaning: 'ở (có người)' },
  { verb: 'みます', dict: 'みる', romaji: 'miru', meaning: 'nhìn' },
  { verb: 'おきます', dict: 'おきる', romaji: 'okiru', meaning: 'thức dậy' },
  { verb: 'かります', dict: 'かりる', romaji: 'kariru', meaning: 'mượn' },
  { verb: 'できます', dict: 'できる', romaji: 'dekiru', meaning: 'có thể' },
  { verb: 'あびます', dict: 'あびる', romaji: 'abiru', meaning: 'tắm' },
  { verb: 'きます', dict: 'きる', romaji: 'kiru', meaning: 'mặc' },
  { verb: 'ねます', dict: 'ねる', romaji: 'neru', meaning: 'ngủ' },
  { verb: 'しらべます', dict: 'しらべる', romaji: 'shiraberu', meaning: 'tra cứu' },
  { verb: 'つかれます', dict: 'つかれる', romaji: 'tsukareru', meaning: 'mệt' },
];

type VerbEntry = { dict: string; masu: string; romaji: string; meaning: string; group: 1 | 2 | 3 };

const verbDB: VerbEntry[] = [
  // Nhóm 1
  { dict: 'かく', masu: 'かきます', romaji: 'kaku', meaning: 'viết', group: 1 },
  { dict: 'よむ', masu: 'よみます', romaji: 'yomu', meaning: 'đọc', group: 1 },
  { dict: 'きく', masu: 'ききます', romaji: 'kiku', meaning: 'nghe', group: 1 },
  { dict: 'はなす', masu: 'はなします', romaji: 'hanasu', meaning: 'nói', group: 1 },
  { dict: 'かう', masu: 'かいます', romaji: 'kau', meaning: 'mua', group: 1 },
  { dict: 'まつ', masu: 'まちます', romaji: 'matsu', meaning: 'chờ', group: 1 },
  { dict: 'かえる', masu: 'かえります', romaji: 'kaeru', meaning: 'về', group: 1 },
  { dict: 'のむ', masu: 'のみます', romaji: 'nomu', meaning: 'uống', group: 1 },
  { dict: 'あそぶ', masu: 'あそびます', romaji: 'asobu', meaning: 'chơi', group: 1 },
  { dict: 'しぬ', masu: 'しにます', romaji: 'shinu', meaning: 'chết', group: 1 },
  { dict: 'およぐ', masu: 'およぎます', romaji: 'oyogu', meaning: 'bơi', group: 1 },
  { dict: 'もつ', masu: 'もちます', romaji: 'motsu', meaning: 'cầm', group: 1 },
  { dict: 'はしる', masu: 'はしります', romaji: 'hashiru', meaning: 'chạy', group: 1 },
  { dict: 'あるく', masu: 'あるきます', romaji: 'aruku', meaning: 'đi bộ', group: 1 },
  { dict: 'いそぐ', masu: 'いそぎます', romaji: 'isogu', meaning: 'vội', group: 1 },
  { dict: 'つくる', masu: 'つくります', romaji: 'tsukuru', meaning: 'làm', group: 1 },
  { dict: 'おくる', masu: 'おくります', romaji: 'okuru', meaning: 'gửi', group: 1 },
  { dict: 'かる', masu: 'かります', romaji: 'karu', meaning: 'cắt (tóc)', group: 1 },
  { dict: 'いる', masu: 'いります', romaji: 'iru', meaning: 'cần', group: 1 },
  { dict: 'もどる', masu: 'もどります', romaji: 'modoru', meaning: 'quay lại', group: 1 },
  { dict: 'いく', masu: 'いきます', romaji: 'iku', meaning: 'đi', group: 1 },
  { dict: 'もらう', masu: 'もらいます', romaji: 'morau', meaning: 'nhận', group: 1 },
  { dict: 'あう', masu: 'あいます', romaji: 'au', meaning: 'gặp', group: 1 },
  { dict: 'はたらく', masu: 'はたらきます', romaji: 'hataraku', meaning: 'làm việc', group: 1 },
  // Nhóm 2
  { dict: 'たべる', masu: 'たべます', romaji: 'taberu', meaning: 'ăn', group: 2 },
  { dict: 'みる', masu: 'みます', romaji: 'miru', meaning: 'nhìn', group: 2 },
  { dict: 'おきる', masu: 'おきます', romaji: 'okiru', meaning: 'thức dậy', group: 2 },
  { dict: 'かりる', masu: 'かります', romaji: 'kariru', meaning: 'mượn', group: 2 },
  { dict: 'できる', masu: 'できます', romaji: 'dekiru', meaning: 'có thể', group: 2 },
  { dict: 'あびる', masu: 'あびます', romaji: 'abiru', meaning: 'tắm', group: 2 },
  { dict: 'きる', masu: 'きます', romaji: 'kiru', meaning: 'mặc', group: 2 },
  { dict: 'ねる', masu: 'ねます', romaji: 'neru', meaning: 'ngủ', group: 2 },
  { dict: 'しらべる', masu: 'しらべます', romaji: 'shiraberu', meaning: 'tra cứu', group: 2 },
  { dict: 'つかれる', masu: 'つかれます', romaji: 'tsukareru', meaning: 'mệt', group: 2 },
  { dict: 'おしえる', masu: 'おしえます', romaji: 'oshieru', meaning: 'dạy', group: 2 },
  { dict: 'あける', masu: 'あけます', romaji: 'akeru', meaning: 'mở', group: 2 },
  { dict: 'しめる', masu: 'しめます', romaji: 'shimeru', meaning: 'đóng', group: 2 },
  { dict: 'でかける', masu: 'でかけます', romaji: 'dekakeru', meaning: 'ra ngoài', group: 2 },
  { dict: 'いれる', masu: 'いれます', romaji: 'ireru', meaning: 'bỏ vào', group: 2 },
  // Nhóm 3
  { dict: 'する', masu: 'します', romaji: 'suru', meaning: 'làm', group: 3 },
  { dict: 'くる', masu: 'きます', romaji: 'kuru', meaning: 'đến', group: 3 },
  { dict: 'べんきょうする', masu: 'べんきょうします', romaji: 'benkyou suru', meaning: 'học', group: 3 },
  { dict: 'さんぽする', masu: 'さんぽします', romaji: 'sanpo suru', meaning: 'đi dạo', group: 3 },
];

const forms: FormDef[] = [
  {
    id: 'te',
    label: 'Thể て',
    group1: 'Bỏ ます → ～い／ち／り → って\n～び／み／に → んで\n～き → いて\n～ぎ → いで\n～し → して',
    group2: 'Bỏ ます → thêm て',
    group3: 'します → して\nきます → きて',
    examples: [
      { label: 'Nhóm 1 (う/つ/る)', g1: '会います → 会って', g2: '待ちます → 待って', g3: '帰ります → 帰って', note: 'う/つ/る → って' },
      { label: 'Nhóm 1 (む/ぶ/ぬ)', g1: '飲みます → 飲んで', g2: '遊びます → 遊んで', g3: '死にます → 死んで', note: 'む/ぶ/ぬ → んで' },
      { label: 'Nhóm 1 (く)', g1: '書きます → 書いて', g2: '働きます → 働いて', g3: '', note: 'く → いて' },
      { label: 'Nhóm 1 (ぐ)', g1: '泳ぎます → 泳いで', g2: '', g3: '', note: 'ぐ → いで' },
      { label: 'Nhóm 1 (す)', g1: '話します → 話して', g2: '', g3: '', note: 'す → して' },
      { label: 'Nhóm 2', g1: '食べます → 食べて', g2: '見ます → 見て', g3: '寝ます → 寝て', note: 'Bỏ ます + て' },
      { label: 'Nhóm 3', g1: 'します → して', g2: 'きます → きて', g3: '', note: '' },
    ],
    exceptions: [
      { verb: 'いきます', correct: 'いって', wrong: 'いいて', note: 'Đặc biệt: Động từ 行く chia て thành 行って (không theo quy tắc く→いて)' },
    ],
  },
  {
    id: 'nai',
    label: 'Thể ない',
    group1: 'Bỏ ます → chuyển về hàng あ + ない',
    group2: 'Bỏ ます → thêm ない',
    group3: 'します → しない\nきます → こない',
    examples: [
      { label: 'Nhóm 1 (う)', g1: '買います → 買わない', g2: '会います → 会わない', g3: '', note: 'う → わない (KHÔNG phải あない)' },
      { label: 'Nhóm 1 (く/ぐ)', g1: '書きます → 書かない', g2: '泳ぎます → 泳がない', g3: '', note: 'く→かない, ぐ→がない' },
      { label: 'Nhóm 1 (す)', g1: '話します → 話さない', g2: '', g3: '', note: 'す→さない' },
      { label: 'Nhóm 1 (つ/る/う)', g1: '待ちます → 待たない', g2: '帰ります → 帰らない', g3: '買います → 買わない', note: 'つ/る/う → た/ら/わない' },
      { label: 'Nhóm 1 (む/ぶ/ぬ)', g1: '飲みます → 飲まない', g2: '遊びます → 遊ばない', g3: '死にます → 死なない', note: 'む/ぶ/ぬ → ま/ば/なない' },
      { label: 'Nhóm 2', g1: '食べます → 食べない', g2: '起きます → 起きない', g3: '', note: 'Bỏ ます + ない' },
      { label: 'Nhóm 3', g1: 'します → しない', g2: 'きます → こない', g3: '', note: '注意: 来ます → こない (đọc là こ)' },
    ],
    exceptions: [
      { verb: 'あります', correct: 'ない', wrong: 'あらない', note: 'Đặc biệt: あります KHÔNG có thể ない. Dùng ない (không) thay thế.' },
      { verb: '買います', correct: '買わない', wrong: '買かない', note: 'Đuôi います → わない (chứ không phải あない)' },
    ],
    tip: '⚠️ Đuôi います → わない. Ví dụ: 買います → 買わない, 会います → 会わない.',
  },
  {
    id: 'ta',
    label: 'Thể た',
    group1: 'Giống cách chia thể て:\n～って → った\n～んで → んだ\n～いて → いた\n～いで → いだ\n～して → した',
    group2: 'Bỏ ます → thêm た',
    group3: 'します → した\nきます → きた\n(đặc biệt)',
    examples: [
      { label: 'Nhóm 1 (う/つ/る)', g1: '会います → 会った', g2: '待ちます → 待った', g3: '帰ります → 帰った', note: '→ った' },
      { label: 'Nhóm 1 (む/ぶ/ぬ)', g1: '飲みます → 飲んだ', g2: '遊びます → 遊んだ', g3: '死にます → 死んだ', note: '→ んだ' },
      { label: 'Nhóm 1 (く)', g1: '書きます → 書いた', g2: '', g3: '', note: '→ いた' },
      { label: 'Nhóm 1 (ぐ)', g1: '泳ぎます → 泳いだ', g2: '', g3: '', note: '→ いだ' },
      { label: 'Nhóm 1 (す)', g1: '話します → 話した', g2: '', g3: '', note: '→ した' },
      { label: 'Nhóm 2', g1: '食べます → 食べた', g2: '見ます → 見た', g3: '', note: 'Bỏ ます + た' },
      { label: 'Nhóm 3', g1: 'します → した', g2: 'きます → きた', g3: '', note: '' },
    ],
    exceptions: [
      { verb: 'いきます', correct: 'いった', wrong: 'いいた', note: 'Đặc biệt: 行く → 行った (giống thể て)' },
    ],
    tip: 'Thể た chia GIỐNG thể て, chỉ khác ở đuôi: て/で → た/だ.',
  },
  {
    id: 'jisho',
    label: '辞書形',
    group1: 'Bỏ ます → chuyển về hàng う',
    group2: 'Bỏ ます → thêm る',
    group3: 'します → する\nきます → くる',
    examples: [
      { label: 'Nhóm 1', g1: '書きます → 書く', g2: '飲みます → 飲む', g3: '話します → 話す', note: 'Về hàng う' },
      { label: 'Nhóm 1 (đuôi います)', g1: '買います → 買う', g2: '会います → 会う', g3: '', note: 'います → う' },
      { label: 'Nhóm 2', g1: '食べます → 食べる', g2: '起きます → 起きる', g3: '見ます → 見る', note: 'Bỏ ます + る' },
      { label: 'Nhóm 3', g1: 'します → する', g2: 'きます → くる', g3: '', note: '' },
    ],
    exceptions: [
      { verb: '帰ります', correct: '帰る', note: 'Nhóm 1 (dù có え+る nhưng là nhóm 1)' },
      { verb: '入ります', correct: '入る', note: 'Nhóm 1 (đặc biệt)' },
    ],
    tip: 'Các từ nhóm 2 có âm cuối え+る (食べる, 教える). Nhưng có ngoại lệ: 帰る, 入る, 走る, 切る là nhóm 1!',
  },
  {
    id: 'potential',
    label: 'Khả năng',
    group1: 'Bỏ ます → về hàng え + ます',
    group2: 'Bỏ ます → られ + ます',
    group3: 'します → できます\nきます → こられます',
    examples: [
      { label: 'Nhóm 1', g1: '書きます → 書けます', g2: '飲みます → 飲めます', g3: '話します → 話せます', note: 'え段 + ます' },
      { label: 'Nhóm 2', g1: '食べます → 食べられます', g2: '見ます → 見られます', g3: '起きます → 起きられます', note: 'Bỏ ます + られます' },
      { label: 'Nhóm 3', g1: 'します → できます', g2: 'きます → こられます', g3: '', note: '' },
    ],
    exceptions: [
      { verb: 'きます (đến)', correct: 'こられる', note: '来ます (đến) → こられます. Phân biệt với 着ます (mặc) → きられます.' },
    ],
    tip: 'Nhóm 2: られます dài, hay được rút gọn thành れる trong văn nói (食べれる → ら抜き言葉). Tuy nhiên, ら抜き là không chuẩn văn viết.',
  },
  {
    id: 'volitional',
    label: 'Ý chí',
    group1: 'Bỏ ます → về hàng お + う',
    group2: 'Bỏ ます → よう',
    group3: 'します → しよう\nきます → こよう',
    examples: [
      { label: 'Nhóm 1', g1: '書きます → 書こう', g2: '飲みます → 飲もう', g3: '話します → 話そう', note: 'お段 + う' },
      { label: 'Nhóm 2', g1: '食べます → 食べよう', g2: '見ます → 見よう', g3: '起きます → 起きよう', note: 'Bỏ ます + よう' },
      { label: 'Nhóm 3', g1: 'します → しよう', g2: 'きます → こよう', g3: '', note: '' },
    ],
    exceptions: [
      { verb: 'きます (đến)', correct: 'こよう', note: '来ます → こよう. Chữ 来 đọc là こ (không phải き)!' },
    ],
    tip: '⚠️ 来ます → こよう (chữ 来 lúc này đọc là こ, rất dễ nhầm với き)',
  },
  {
    id: 'causative',
    label: 'Sai khiến',
    group1: 'Bỏ ます → về hàng あ + せます',
    group2: 'Bỏ ます → させます',
    group3: 'します → させます\nきます → こさせます',
    examples: [
      { label: 'Nhóm 1', g1: '書きます → 書かせます', g2: '飲みます → 飲ませます', g3: '話します → 話させます', note: 'あ段 + せます' },
      { label: 'Nhóm 2', g1: '食べます → 食べさせます', g2: '見ます → 見させます', g3: '', note: 'Bỏ ます + させます' },
      { label: 'Nhóm 3', g1: 'します → させます', g2: 'きます → こさせます', g3: '', note: '' },
    ],
    exceptions: [],
    tip: 'Ý nghĩa: "Bắt/cho ai đó làm gì". 母は子供に野菜を食べさせます (Mẹ bắt con ăn rau).',
  },
  {
    id: 'passive',
    label: 'Bị động',
    group1: 'Bỏ ます → về hàng あ + れます',
    group2: 'Bỏ ます → られます',
    group3: 'します → されます\nきます → こられます',
    examples: [
      { label: 'Nhóm 1', g1: '書きます → 書かれます', g2: '飲みます → 飲まれます', g3: '話します→話されます', note: 'あ段 + れます' },
      { label: 'Nhóm 2', g1: '食べます → 食べられます', g2: '見ます → 見られます', g3: '', note: 'Bỏ ます + られます' },
      { label: 'Nhóm 3', g1: 'します → されます', g2: 'きます → こられます', g3: '', note: '' },
    ],
    exceptions: [],
    tip: 'Nhóm 1 đuôi す (話します): bỏ す→さ→されます. Các đuôi khác: か→かれる, ま→まれる.',
  },
  {
    id: 'causpassive',
    label: 'Sai khiến bị động',
    group1: 'C1 (đầy đủ): あ段 + せられます\nC2 (rút gọn): あ段 + されます',
    group2: 'Bỏ ます → させられます',
    group3: 'します → させられます\nきます → こさせられます',
    examples: [
      { label: 'Nhóm 1 (C1)', g1: '書きます→書かせられます', g2: '飲みます→飲ませられます', g3: '', note: 'Dạng đầy đủ' },
      { label: 'Nhóm 1 (C2 rút gọn)', g1: '書きます→書かされます', g2: '飲みます→飲まされます', g3: '話します→話させられます', note: 'Dạng rút gọn (～される)' },
      { label: 'Nhóm 2', g1: '食べます→食べさせられます', g2: '見ます→見させられます', g3: '', note: 'Bỏ ます + させられます' },
      { label: 'Nhóm 3', g1: 'します→させられます', g2: 'きます→こさせられます', g3: '', note: '' },
    ],
    exceptions: [
      { verb: '話します', correct: '話させられます', note: 'Đuôi し KHÔNG được rút gọn thành 話さされます. Bắt buộc dùng C1!' },
    ],
    tip: '⚠️ Đuôi し (như 話します) CHỈ chia theo C1: 話させられます. Không có dạng rút gọn 話さされます.',
  },
];

export default function ConjugationReferencePage() {
  const [activeForm, setActiveForm] = useState('te');
  const [search, setSearch] = useState('');
  const [showEx, setShowEx] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);

  const form = forms.find(f => f.id === activeForm)!;

  const searchResults = search.trim()
    ? verbDB.filter(v =>
        v.romaji.includes(search.toLowerCase().replace(/\s+/g, '')) ||
        v.dict.includes(search) ||
        v.masu.includes(search) ||
        v.meaning.includes(search)
      ).slice(0, 8)
    : [];

  const filteredSpecials = ichidanSpecials.filter(s =>
    s.verb.includes(search) || s.dict.includes(search) || s.meaning.includes(search) || s.romaji.includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <h1 className="text-lg font-bold text-gray-800">Bảng chia động từ</h1>
          </div>
          <div className="relative max-w-48 w-full">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tra romaji: kaku, taberu..."
              className="w-full pl-8 pr-2 py-1.5 text-sm bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-indigo-300 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Form tabs */}
      <div className="max-w-5xl mx-auto px-4 pt-4 overflow-x-auto">
        <div className="flex gap-1.5 flex-wrap">
          {forms.map(f => (
            <button key={f.id} onClick={() => { setActiveForm(f.id); setShowEx(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeForm === f.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Persistent special ichidan warning */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div style={{ background: '#FFF7ED', borderLeft: '4px solid #F59E0B' }} className="rounded-r-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">⚠️</span>
            <span className="text-sm font-bold" style={{ color: '#333' }}>Nhóm 2 đặc biệt</span>
          </div>
          <p className="text-sm" style={{ color: '#555' }}>Các từ sau có âm cuối thuộc hàng い nhưng là Nhóm 2 (一段動詞).</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ichidanSpecials.map(s => (
              <span key={s.verb} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>
                <span className="font-bold">{s.dict}</span>
                <span className="opacity-60">({s.verb})</span>
                <span className="opacity-50">—</span>
                <span>{s.meaning}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mnemonic for special ichidan */}
      <div className="max-w-5xl mx-auto px-4 mt-3">
        <button onClick={() => setShowMnemonic(!showMnemonic)} className="w-full flex items-center justify-between text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 transition-all" style={{ color: '#333' }}>
          <span>🧠 Ghi nhớ Nhóm 2 đặc biệt</span>
          <span className="text-gray-400 text-sm">{showMnemonic ? '▲' : '▼'}</span>
        </button>
        {showMnemonic && (
        <div style={{ background: '#F0FDF4', borderLeft: '4px solid #22C55E' }} className="rounded-r-xl px-4 py-3 mt-1">
          <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
            Sáng <span className="font-bold text-emerald-700">THỨC DẬY</span> (おきる), thấy mình vẫn đang <span className="font-bold text-emerald-700">Ở nhà</span> (いる).
            Đi <span className="font-bold text-emerald-700">TẮM</span> (あびる) một cái cho tỉnh táo, rồi <span className="font-bold text-emerald-700">MẶC</span> quần áo (きる).
            <span className="font-bold text-emerald-700">MƯỢN</span> sách (かりる) đem ra <span className="font-bold text-emerald-700">TRA CỨU</span> (しらべる), <span className="font-bold text-emerald-700">NHÌN</span> một lúc (みる) là đã <span className="font-bold text-emerald-700">CÓ THỂ</span> (できる) hiểu bài.
            Học nhiều nên thấy <span className="font-bold text-emerald-700">MỆT</span> (つかれる), liền đi <span className="font-bold text-emerald-700">NGỦ</span> (ねる).
          </p>
        </div>
        )}
      </div>

      {/* Main card */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Formula section */}
          <div className="p-5 border-b border-gray-100">
            <div className="text-sm font-bold text-indigo-500 tracking-wider mb-4">{form.label.toUpperCase()} — CÔNG THỨC</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Nhóm 1 (五段)', content: form.group1 },
                { label: 'Nhóm 2 (一段)', content: form.group2 },
                { label: 'Nhóm 3 (不規則)', content: form.group3 },
              ].map(col => (
                <div key={col.label} className="rounded-xl p-3" style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}>
                  <div className="text-sm font-bold text-indigo-600 mb-2">{col.label}</div>
                  <div className="text-base leading-relaxed" style={{ color: '#444' }}>{col.content.split('\n').map((line, i) => <div key={i}>{renderRuby(line)}</div>)}</div>
                </div>
              ))}
            </div>

            {/* Tip */}
            {form.tip && (
              <div className="mt-4 flex items-start gap-2 text-base p-3 rounded-xl" style={{ background: '#FFF7ED', color: '#92400E' }}>
                <span>💡</span>
                <span>{form.tip}</span>
              </div>
            )}
          </div>

          {/* Exceptions */}
          {form.exceptions.length > 0 && (
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="text-sm font-bold text-red-500 mb-3">🚨 NGOẠI LỆ QUAN TRỌNG</div>
              <div className="space-y-2">
                {form.exceptions.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <span className="text-red-500 shrink-0 font-bold">!</span>
                    <div>
                      <span className="font-bold text-red-700">{renderRuby(ex.verb)}</span>
                      <span className="text-red-600"> → </span>
                      <span className="font-bold" style={{ color: '#7C3AED' }}>{renderRuby(ex.correct)}</span>
                      {ex.wrong && <><span className="text-red-400"> (không phải </span><span className="line-through text-red-300">{renderRuby(ex.wrong)}</span><span className="text-red-400">)</span></>}
                      <div className="text-red-700 mt-0.5">{ex.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples toggle */}
          <div className="px-5 py-3 border-b border-gray-100">
            <button onClick={() => setShowEx(!showEx)} className="flex items-center gap-2 text-sm font-medium text-indigo-500 hover:text-indigo-700 transition-colors">
              <span className={`transition-transform ${showEx ? 'rotate-90' : ''}`}>▸</span>
              {showEx ? 'Thu gọn ví dụ' : `Xem ví dụ (${form.examples.length})`}
            </button>
          </div>

          {/* Examples accordion */}
          {showEx && (
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-indigo-100">
                      <th className="text-left py-2 pr-3 font-bold text-indigo-600">Mẫu</th>
                      <th className="text-left py-2 px-3 font-bold text-indigo-600">Ví dụ 1</th>
                      <th className="text-left py-2 px-3 font-bold text-indigo-600">Ví dụ 2</th>
                      <th className="text-left py-2 px-3 font-bold text-indigo-600">Ví dụ 3</th>
                      <th className="text-left py-2 pl-3 font-bold text-indigo-600">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.examples.map((ex, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-2 pr-3 font-medium whitespace-nowrap" style={{ color: '#333' }}>{ex.label}</td>
                        <td className="py-2 px-3 text-base font-mono" style={{ color: '#7C3AED' }}>{ex.g1 ? renderRuby(ex.g1) : '—'}</td>
                        <td className="py-2 px-3 text-base font-mono" style={{ color: '#7C3AED' }}>{ex.g2 ? renderRuby(ex.g2) : '—'}</td>
                        <td className="py-2 px-3 text-base font-mono" style={{ color: '#7C3AED' }}>{ex.g3 ? renderRuby(ex.g3) : '—'}</td>
                        <td className="py-2 pl-3 text-gray-500">{ex.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Search results */}
          {search && (
            <div className="px-5 py-4">
              <div className="text-sm font-bold text-gray-500 mb-3">Kết quả tìm kiếm cho &quot;{search}&quot;</div>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.map(v => (
                    <div key={v.dict} className="text-sm p-3 rounded-xl flex items-center justify-between" style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold font-mono" style={{ color: '#7C3AED' }}>{v.dict}</span>
                        <div className="text-gray-500">
                          <div className="font-medium">{v.masu}</div>
                          <div className="italic" style={{ color: '#9CA3AF' }}>{v.romaji}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          v.group === 1 ? 'bg-blue-100 text-blue-700' :
                          v.group === 2 ? 'bg-green-100 text-green-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>N{v.group}</span>
                        <div className="text-gray-400 mt-0.5">{v.meaning}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredSpecials.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredSpecials.map(s => (
                    <div key={s.verb} className="text-sm p-2 rounded-lg bg-gray-50 flex items-center gap-2" style={{ color: '#333' }}>
                      <span className="font-bold font-mono">{s.dict}</span>
                      <span className="text-gray-400">({s.verb})</span>
                      <span className="text-gray-500">— {s.meaning}</span>
                      <span className="text-sm italic text-gray-400 ml-auto">{s.romaji}</span>
                      <span className="text-indigo-500 ml-1 font-medium">→ N2 đặc biệt</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400 py-4 text-center">Không tìm thấy động từ phù hợp. Thử gõ romaji (miru, kaku, taberu...)</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
