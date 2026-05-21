'use client';

import { useState } from 'react';

type Verb = { dict: string; masu: string; te: string; nai: string; ta: string; meaning: string };

const verbs: Verb[] = [
  { dict: '食べる', masu: '食べます', te: '食べて', nai: '食べない', ta: '食べた', meaning: 'ăn' },
  { dict: '飲む', masu: '飲みます', te: '飲んで', nai: '飲まない', ta: '飲んだ', meaning: 'uống' },
  { dict: '行く', masu: '行きます', te: '行って', nai: '行かない', ta: '行った', meaning: 'đi' },
  { dict: '来る', masu: '来ます', te: '来て', nai: '来ない', ta: '来た', meaning: 'đến' },
  { dict: 'する', masu: 'します', te: 'して', nai: 'しない', ta: 'した', meaning: 'làm' },
  { dict: '見る', masu: '見ます', te: '見て', nai: '見ない', ta: '見た', meaning: 'xem' },
  { dict: '書く', masu: '書きます', te: '書いて', nai: '書かない', ta: '書いた', meaning: 'viết' },
  { dict: '読む', masu: '読みます', te: '読んで', nai: '読まない', ta: '読んだ', meaning: 'đọc' },
  { dict: '聞く', masu: '聞きます', te: '聞いて', nai: '聞かない', ta: '聞いた', meaning: 'nghe' },
  { dict: '話す', masu: '話します', te: '話して', nai: '話さない', ta: '話した', meaning: 'nói' },
  { dict: '買う', masu: '買います', te: '買って', nai: '買わない', ta: '買った', meaning: 'mua' },
  { dict: '待つ', masu: '待ちます', te: '待って', nai: '待たない', ta: '待った', meaning: 'chờ' },
  { dict: '帰る', masu: '帰ります', te: '帰って', nai: '帰らない', ta: '帰った', meaning: 'về' },
  { dict: '起きる', masu: '起きます', te: '起きて', nai: '起きない', ta: '起きた', meaning: 'dậy' },
  { dict: '寝る', masu: '寝ます', te: '寝て', nai: '寝ない', ta: '寝た', meaning: 'ngủ' },
  { dict: '遊ぶ', masu: '遊びます', te: '遊んで', nai: '遊ばない', ta: '遊んだ', meaning: 'chơi' },
  { dict: '死ぬ', masu: '死にます', te: '死んで', nai: '死なない', ta: '死んだ', meaning: 'chết' },
  { dict: '泳ぐ', masu: '泳ぎます', te: '泳いで', nai: '泳がない', ta: '泳いだ', meaning: 'bơi' },
  { dict: '持つ', masu: '持ちます', te: '持って', nai: '持たない', ta: '持った', meaning: 'cầm' },
  { dict: '走る', masu: '走ります', te: '走って', nai: '走らない', ta: '走った', meaning: 'chạy' },
  { dict: '教える', masu: '教えます', te: '教えて', nai: '教えない', ta: '教えた', meaning: 'dạy' },
  { dict: '開ける', masu: '開けます', te: '開けて', nai: '開けない', ta: '開けた', meaning: 'mở' },
  { dict: '閉める', masu: '閉めます', te: '閉めて', nai: '閉めない', ta: '閉めた', meaning: 'đóng' },
  { dict: '歩く', masu: '歩きます', te: '歩いて', nai: '歩かない', ta: '歩いた', meaning: 'đi bộ' },
];

type Form = 'masu' | 'te' | 'nai' | 'ta';
const forms: { key: Form; label: string }[] = [
  { key: 'masu', label: 'ます形' },
  { key: 'te', label: 'て形' },
  { key: 'nai', label: 'ない形' },
  { key: 'ta', label: 'た形' },
];

export default function ConjugationPage() {
  const [formType, setFormType] = useState<Form>('te');
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const verb = verbs[current];
  const answer = verb[formType];

  function check() {
    const isCorrect = input.trim() === answer;
    setResult(isCorrect ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setCurrent((c) => (c + 1) % verbs.length);
    setInput('');
    setResult(null);
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🔄 Chia động từ</h1>
      <p className="text-sm text-gray-500 mb-4">Đúng: {score.correct}/{score.total}</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {forms.map((f) => (
          <button key={f.key} onClick={() => { setFormType(f.key); setResult(null); setInput(''); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${formType === f.key ? 'bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-6">
        <p className="text-3xl font-bold text-gray-800 mb-1">{verb.dict}</p>
        <p className="text-sm text-gray-500">{verb.meaning}</p>
        <p className="text-xs text-indigo-400 mt-2">→ Chuyển sang {forms.find((f) => f.key === formType)?.label}</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !result && check()}
          placeholder="Nhập đáp án..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {!result ? (
          <button onClick={check} className="px-5 py-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium shadow">
            Kiểm tra
          </button>
        ) : (
          <button onClick={next} className="px-5 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl font-medium shadow">
            Tiếp →
          </button>
        )}
      </div>

      {result && (
        <div className={`text-center p-4 rounded-xl ${result === 'correct' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          <p className="font-bold text-lg">{result === 'correct' ? '✅ Đúng!' : '❌ Sai!'}</p>
          {result === 'wrong' && <p className="text-sm mt-1">Đáp án: <span className="font-bold">{answer}</span></p>}
        </div>
      )}
    </div>
  );
}
