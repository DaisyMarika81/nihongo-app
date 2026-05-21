'use client';

import { useState, useEffect } from 'react';
import { speak } from '@/lib/speak';

const words = [
  { jp: 'まにあう', vn: 'Kịp giờ' }, { jp: 'おくれます', vn: 'Trễ giờ' },
  { jp: 'やります', vn: 'Làm' }, { jp: 'そうだんします', vn: 'Trao đổi' },
  { jp: 'ちゅういします', vn: 'Chú ý' }, { jp: 'しょうらい', vn: 'Tương lai' },
  { jp: 'へんじ', vn: 'Trả lời' }, { jp: 'まじめ', vn: 'Chăm chỉ' },
  { jp: 'せわします', vn: 'Chăm sóc' }, { jp: 'おきゃくさん', vn: 'Khách hàng' },
  { jp: 'もうしこみます', vn: 'Đăng ký' }, { jp: 'けいけん', vn: 'Kinh nghiệm' },
  { jp: 'つごうがいい', vn: 'Rảnh' }, { jp: 'つごうがわるい', vn: 'Ko rảnh' },
  { jp: 'よてい', vn: 'Dự định' }, { jp: 'かいぎ', vn: 'Cuộc họp' },
  { jp: 'しゅっせき', vn: 'Tham dự' }, { jp: 'ひつよう', vn: 'Cần thiết' },
  { jp: 'きゅうりょう', vn: 'Tiền lương' }, { jp: 'ねっしん', vn: 'Nhiệt tình' },
  { jp: 'へいてん', vn: 'Đóng cửa' }, { jp: 'しらせます', vn: 'Thông báo' },
  { jp: 'じけん', vn: 'Sự kiện' }, { jp: 'たしかめます', vn: 'Xác minh' },
  { jp: 'じょうほう', vn: 'Thông tin' }, { jp: 'おこないます', vn: 'Tổ chức' },
  { jp: 'ふくざつ', vn: 'Phức tạp' }, { jp: 'きめます', vn: 'Quyết định' },
  { jp: 'たのみます', vn: 'Nhờ vả' }, { jp: 'つとめます', vn: 'Làm việc' },
  { jp: 'つたえます', vn: 'Truyền đạt' }, { jp: 'こまります', vn: 'Gặp khó khăn' },
  { jp: 'よういします', vn: 'Chuẩn bị' }, { jp: 'ちゅうしします', vn: 'Hoãn' },
  { jp: 'はじまります', vn: 'Bắt đầu' }, { jp: 'しりょう', vn: 'Tài liệu' },
  { jp: 'つかれます', vn: 'Mệt' }, { jp: 'はっきり', vn: 'Rõ ràng' },
  { jp: 'はっぴょうします', vn: 'Phát biểu' }, { jp: 'つづけます', vn: 'Tiếp tục' },
];

type Step = 1 | 2 | 3 | 4;
const STORAGE_KEY = 'nihongo_a4_session1';

export default function A4MethodPage() {
  const [step, setStep] = useState<Step>(1);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [wrongList, setWrongList] = useState<number[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { step: s, wrongList: w } = JSON.parse(saved);
      if (s) setStep(s);
      if (w) setWrongList(w);
    }
  }, []);

  function save(s: Step, w: number[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: s, wrongList: w }));
  }

  function check() {
    const word = words[index];
    const correct = step === 2 || step === 4
      ? input.trim().toLowerCase() === word.vn.toLowerCase()
      : input.trim() === word.jp;
    setResults({ ...results, [index]: correct });
    setShowAnswer(true);
    if (!correct && !wrongList.includes(index)) {
      const newWrong = [...wrongList, index];
      setWrongList(newWrong);
      save(step, newWrong);
    }
  }

  function nextWord() {
    setInput(''); setShowAnswer(false);
    if (index + 1 >= words.length) return;
    setIndex(index + 1);
  }

  function nextStep() {
    const next = (step + 1) as Step;
    setStep(next > 4 ? 1 : next);
    setIndex(0); setInput(''); setResults({}); setShowAnswer(false);
    save(next > 4 ? 1 : next, wrongList);
  }

  function resetAll() {
    setStep(1); setIndex(0); setInput(''); setResults({}); setWrongList([]); setShowAnswer(false);
    localStorage.removeItem(STORAGE_KEY);
  }

  const word = index < words.length ? words[index] : words[0];
  const isLastWord = index >= words.length - 1;
  const correctCount = Object.values(results).filter(Boolean).length;

  const stepInfo: Record<Step, { title: string; prompt: string; showField: 'jp' | 'vn'; answerField: 'jp' | 'vn' }> = {
    1: { title: '🌅 Bước 1: Sáng — Đọc từ mới', prompt: 'Đọc và ghi nhớ', showField: 'jp', answerField: 'vn' },
    2: { title: '☀️ Bước 2: Trưa — Nhìn JP viết VN', prompt: 'Viết nghĩa tiếng Việt', showField: 'jp', answerField: 'vn' },
    3: { title: '🌙 Bước 3: Tối — Nhìn VN viết JP', prompt: 'Viết lại từ tiếng Nhật', showField: 'vn', answerField: 'jp' },
    4: { title: '🌅 Bước 4: Sáng hôm sau — Kiểm tra', prompt: 'Viết nghĩa tiếng Việt', showField: 'jp', answerField: 'vn' },
  };

  const info = stepInfo[step];

  // Step 1: Just read through
  if (step === 1) {
    return (
      <div className="min-h-screen p-4 pb-24">
        <h1 className="text-xl font-bold text-gray-800 mb-1">{info.title}</h1>
        <p className="text-sm text-gray-500 mb-4">Đọc qua {words.length} từ, ghi nhớ khái quát</p>
        <p className="text-xs text-gray-400 mb-4">{index + 1}/{words.length}</p>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-4">
          <button onClick={() => speak(word.jp)} className="text-lg mb-2">🔊</button>
          <p className="text-3xl font-bold text-gray-800 mb-2">{word.jp}</p>
          <p className="text-lg text-emerald-600">{word.vn}</p>
        </div>

        <div className="flex gap-3 justify-center">
          {index > 0 && <button onClick={() => setIndex(index - 1)} className="px-4 py-2 bg-gray-200 rounded-xl text-sm">← Trước</button>}
          {!isLastWord ? (
            <button onClick={() => setIndex(index + 1)} className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm shadow">Tiếp →</button>
          ) : (
            <button onClick={nextStep} className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl text-sm shadow">✓ Xong → Bước 2</button>
          )}
        </div>
      </div>
    );
  }

  // Steps 2, 3, 4: Write and check
  if (index >= words.length) {
    // trigger summary
    const correctCount = Object.values(results).filter(Boolean).length;
    return (
      <div className="min-h-screen p-4 pb-24 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-4">{info.title} — Kết quả</h1>
        <p className="text-emerald-600 font-bold text-lg">✅ Đúng: {correctCount}/{words.length}</p>
        <p className="text-red-500 text-sm mt-1">❌ Sai: {words.length - correctCount}</p>
        {wrongList.length > 0 && (
          <div className="mt-4 text-left bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-sm font-bold text-red-600 mb-2">📝 Từ cần chép riêng:</p>
            {wrongList.map((i) => (
              <p key={i} className="text-sm text-gray-700">{words[i].jp} — {words[i].vn}</p>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3 mt-6">
          {step < 4 && <button onClick={nextStep} className="py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow">Tiếp → {stepInfo[(step + 1) as Step]?.title}</button>}
          {step === 4 && <p className="text-emerald-600 font-bold">🎉 Hoàn thành phương pháp A4!</p>}
          <button onClick={resetAll} className="py-3 bg-gray-200 rounded-xl font-medium">🔄 Làm lại từ đầu</button>
        </div>
      </div>
    );
  }

  const question = info.showField === 'jp' ? word.jp : word.vn;
  const answer = info.answerField === 'jp' ? word.jp : word.vn;

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-lg font-bold text-gray-800 mb-1">{info.title}</h1>
      <p className="text-xs text-gray-400 mb-4">{index + 1}/{words.length} • Đúng: {correctCount}</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-4">
        {info.showField === 'jp' && <button onClick={() => speak(word.jp)} className="text-lg mb-2">🔊</button>}
        <p className="text-2xl font-bold text-gray-800">{question}</p>
        <p className="text-xs text-gray-400 mt-2">{info.prompt}</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !showAnswer && check()}
          placeholder={info.prompt + '...'}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          disabled={showAnswer}
        />
        {!showAnswer ? (
          <button onClick={check} className="px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium shadow">Check</button>
        ) : (
          <button onClick={() => { nextWord(); if (isLastWord) setIndex(words.length); }} className="px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium shadow">Tiếp</button>
        )}
      </div>

      {showAnswer && (
        <div className={`p-4 rounded-xl text-center ${results[index] ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          <p className="font-bold">{results[index] ? '✅ Đúng!' : '❌ Sai!'}</p>
          {!results[index] && <p className="text-sm mt-1">Đáp án: <strong>{answer}</strong></p>}
        </div>
      )}
    </div>
  );
}
