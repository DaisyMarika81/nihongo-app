'use client';

import { useState, useMemo, useEffect } from 'react';
import { grammar, GrammarEntry } from '@/data/grammar';
import { speak } from '@/lib/speak';

type Category = {
  id: string;
  label: string;
  emoji: string;
  filter: (e: GrammarEntry) => boolean;
};

const categories: Category[] = [
  {
    id: 'cho-nhan',
    label: 'Cho - Nhận',
    emoji: '🤲',
    filter: (e) => /あげ|もら(い|っ)|くれ|いただき|くださ/.test(e.pattern),
  },
  {
    id: 'nguyen-nhan',
    label: 'Nguyên nhân',
    emoji: '🎯',
    filter: (e) => /(原因|原|て.*なくて)/.test(e.meaning) || e.pattern.includes('原因'),
  },
  {
    id: 'the-te',
    label: 'Thể て',
    emoji: '🔗',
    filter: (e) => /V て/.test(e.pattern) && !/ない/.test(e.pattern),
  },
  {
    id: 'the-nai',
    label: 'Thể ない',
    emoji: '🚫',
    filter: (e) => /ない/.test(e.pattern),
  },
  {
    id: 'thu-tu',
    label: 'Thứ tự hành động',
    emoji: '📋',
    filter: (e) => /ながら|前に|あとで|とき|V て、/.test(e.pattern),
  },
  {
    id: 'liet-ke',
    label: 'Liệt kê',
    emoji: '📝',
    filter: (e) => /たり/.test(e.pattern),
  },
  {
    id: 'trich-dan',
    label: 'Trích dẫn',
    emoji: '💬',
    filter: (e) => /と(思|言|書|読|言い)|でしょう/.test(e.pattern),
  },
  {
    id: 'dieu-kien',
    label: 'Điều kiện',
    emoji: '⚡',
    filter: (e) => /(た|ば)ら|条件|と、|ても/.test(e.pattern) || e.pattern.includes('ば'),
  },
  {
    id: 'du-dinh',
    label: 'Dự định',
    emoji: '🎯',
    filter: (e) => /たい|ほしい|意向|つもり|ようと/.test(e.pattern),
  },
  {
    id: 'loi-khuyen',
    label: 'Lời khuyên',
    emoji: '💡',
    filter: (e) => /ほうがいい|たらいい|たほう/.test(e.pattern),
  },
  {
    id: 'so-dang',
    label: 'そう (様態)',
    emoji: '👀',
    filter: (e) => /様態|そうです|そうにない|そうもない|さそう/.test(e.pattern) || e.pattern.includes('そうです'),
  },
];

const particlePattern = 'に|を|が|は|で|へ|と|から|まで|より|の|も|など|や|か|て|でも|では';

function highlightFormula(text: string): string {
  const withParts = text
    .replace(new RegExp(`(V|N|A|Adj)(（[^）]*）)?`, 'g'), '<span style="color:#7C3AED;font-weight:600">$&</span>')
    .replace(new RegExp(`(${particlePattern})`, 'g'), '<span style="color:#333;font-weight:500">$1</span>')
    .replace(/(～|…)/g, '<span style="color:#F59E0B;font-weight:700">$&</span>');
  return withParts;
}

const teConjugationRules = {
  group1: `う/つ/る → って\nむ/ぶ/ぬ → んで\nく → いて\nぐ → いで\nす → して`,
  group2: `Bỏ ます + て`,
  group3: `します → して\nきます → きて`,
  exceptions: [
    { verb: '行きます (いく)', correct: '行って (いって)', wrong: '行いて', note: 'Đặc biệt! 行く → 行って (không theo quy tắc く→いて)' },
  ],
  ichidanSpecials: [] as { dict: string; masu: string; romaji: string; meaning: string }[],
};

const naiConjugationRules = {
  group1: `う → わない (chú ý: không phải あない)\nく/ぐ → かない/がない\nす → さない\nつ/る → たない/らない\nむ/ぶ/ぬ → まない/ばない/なない`,
  group2: `Bỏ ます + ない`,
  group3: `します → しない\nきます → こない`,
  exceptions: [
    { verb: 'あります (aru)', correct: 'ない', wrong: 'あらない', note: 'あります không có thể ない. Dùng ない (không).' },
    { verb: '買います (kau)', correct: '買わない', wrong: '買かない', note: 'Đuôi います → わない (không phải あない)!' },
  ],
  ichidanSpecials: [
    { dict: 'いる', masu: 'います', romaji: 'iru', meaning: 'ở' },
    { dict: 'みる', masu: 'みます', romaji: 'miru', meaning: 'nhìn' },
    { dict: 'おきる', masu: 'おきます', romaji: 'okiru', meaning: 'thức dậy' },
    { dict: 'かりる', masu: 'かります', romaji: 'kariru', meaning: 'mượn' },
    { dict: 'できる', masu: 'できます', romaji: 'dekiru', meaning: 'có thể' },
    { dict: 'あびる', masu: 'あびます', romaji: 'abiru', meaning: 'tắm' },
    { dict: 'きる', masu: 'きます', romaji: 'kiru', meaning: 'mặc' },
    { dict: 'ねる', masu: 'ねます', romaji: 'neru', meaning: 'ngủ' },
    { dict: 'しらべる', masu: 'しらべます', romaji: 'shiraberu', meaning: 'tra cứu' },
    { dict: 'つかれる', masu: 'つかれます', romaji: 'tsukareru', meaning: 'mệt' },
  ],
};

export default function GrammarReferencePage() {
  const [activeId, setActiveId] = useState('cho-nhan');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('gr-ck');
    if (saved) setChecked(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('gr-ck', JSON.stringify(checked));
  }, [checked]);

  const grouped = useMemo(() => {
    const map: Record<string, GrammarEntry[]> = {};
    for (const cat of categories) {
      const items = grammar.filter((e) => cat.filter(e) && (search
        ? e.pattern.toLowerCase().includes(search.toLowerCase()) ||
          e.meaning.toLowerCase().includes(search.toLowerCase())
        : true));
      if (items.length) map[cat.id] = items;
    }
    return map;
  }, [search]);

  const visibleCats = categories.filter((c) => grouped[c.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <h1 className="text-base font-bold text-gray-800">Sổ tay ngữ pháp</h1>
          </div>
          <div className="relative max-w-xs w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm cấu trúc..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-indigo-300 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0 sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-y-auto border-r border-gray-200 bg-white">
          <nav className="p-3 space-y-0.5">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 pb-2 pt-1">Mục lục</div>
            {categories.map((cat) => {
              const count = grouped[cat.id]?.length;
              if (!count) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveId(cat.id);
                    document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    activeId === cat.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="flex-1 truncate">{cat.label}</span>
                  <span className="text-[11px] text-gray-400 font-medium">{count}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 space-y-8 max-w-full overflow-hidden">
          {visibleCats.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500">Không tìm thấy cấu trúc nào</p>
            </div>
          )}

          {visibleCats.map((cat) => {
            const items = grouped[cat.id] || [];
            const isTeNai = cat.id === 'the-te' || cat.id === 'the-nai';
            const rules = cat.id === 'the-te' ? teConjugationRules : naiConjugationRules;
            return (
              <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-20">
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">{cat.emoji}</span>
                  <h2 className="text-lg font-bold text-gray-800">{cat.label.toUpperCase()}</h2>
                  <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>

                {/* Conjugation rules for て/ない categories */}
                {isTeNai && (
                  <div className="mb-6 space-y-4">
                    {/* Warning box for special ichidan verbs */}
                    {cat.id === 'the-nai' && (
                      <div style={{ background: '#FFF7ED', borderLeft: '4px solid #F59E0B' }} className="rounded-r-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span>⚠️</span>
                          <span className="text-sm font-bold" style={{ color: '#333' }}>Nhóm 2 đặc biệt</span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: '#555' }}>Các từ sau âm cuối thuộc hàng い nhưng là Nhóm 2:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rules.ichidanSpecials.map(s => (
                            <span key={s.dict} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#FEF3C7', color: '#92400E' }}>
                              <span className="font-bold">{s.dict}</span>
                              <span className="opacity-60">({s.masu})</span>
                              <span className="opacity-50">—</span>
                              <span>{s.meaning}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rule cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { label: 'Nhóm 1 (五段)', content: rules.group1 },
                        { label: 'Nhóm 2 (一段)', content: rules.group2 },
                        { label: 'Nhóm 3 (不規則)', content: rules.group3 },
                      ].map(col => (
                        <div key={col.label} className="rounded-xl p-3" style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}>
                          <div className="text-xs font-bold text-indigo-600 mb-2">{col.label}</div>
                          <div className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#444' }}>{col.content}</div>
                        </div>
                      ))}
                    </div>

                    {/* Exceptions */}
                    {rules.exceptions.length > 0 && (
                      <div className="space-y-2">
                        {rules.exceptions.map((ex, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs p-3 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                            <span className="text-red-500 shrink-0 font-bold">!</span>
                            <div>
                              <span className="font-bold text-red-700">{ex.verb}</span>
                              <span className="text-red-600"> → </span>
                              <span className="font-bold" style={{ color: '#7C3AED' }}>{ex.correct}</span>
                              {ex.wrong && <><span className="text-red-400"> (không phải </span><span className="line-through text-red-300">{ex.wrong}</span><span className="text-red-400">)</span></>}
                              <div className="text-red-700 mt-0.5">{ex.note}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Grammar cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((g) => {
                    const isExpanded = expanded[g.id] || false;
                    const isChecked = checked[g.id] || false;
                    return (
                      <div
                        key={g.id}
                        className={`bg-white rounded-xl border transition-all ${
                          isChecked ? 'border-green-200 opacity-70' : 'border-gray-200 shadow-sm'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => setChecked({ ...checked, [g.id]: !isChecked })}
                              className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                                isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-400'
                              }`}
                            >
                              {isChecked && <span className="text-[9px] text-white font-bold">✓</span>}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-bold font-mono leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: highlightFormula(g.pattern) }}
                              />
                              <div className="text-[13px] text-gray-600 mt-0.5">{g.meaning}</div>
                            </div>
                          </div>

                          <div className="flex justify-end mt-3">
                            <button
                              onClick={() => setExpanded({ ...expanded, [g.id]: !isExpanded })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors border border-indigo-100"
                            >
                              <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▸</span>
                              {isExpanded ? 'Thu gọn' : 'Ví dụ'}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                              <div className="flex items-start gap-1.5">
                                <button onClick={() => speak(g.example)} className="text-[11px] mt-0.5 shrink-0">🔊</button>
                                <span className="text-[13px] text-gray-800">{g.example}</span>
                              </div>
                              <div className="text-[12px] text-gray-500 italic">{g.exampleMeaning}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="h-12" />
        </main>
      </div>
    </div>
  );
}
