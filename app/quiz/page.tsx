'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QuizCard from '../components/QuizCard';
import { getQuizSets, saveQuizSet, deleteQuizSet, reorderQuizSets, getQuizOrder, type QuizSet } from '../../lib/quiz-sets';
import { useAuth } from '@/lib/auth';
import { hiragana } from '../../data/hiragana';
import { katakana } from '../../data/katakana';
import { vocabLessons1to10 } from '../../data/vocabulary/lessons-1-10';
import { vocabLessons11to25 } from '../../data/vocabulary/lessons-11-25';
import { grammar } from '../../data/grammar';

type QuizMode = 'Kana' | 'Vocabulary' | 'Grammar' | 'Import';
type QuizStyle = 'instant' | 'test';
type Question = { question: string; options: string[]; correctIndex: number };
type ImportItem = { kanji: string; meaning: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(mode: QuizMode, count = 10): Question[] {
  if (mode === 'Kana') {
    const pool = shuffle([...hiragana, ...katakana]);
    return pool.slice(0, count).map((item) => {
      const wrong = shuffle(pool.filter((k) => k.romaji !== item.romaji))
        .slice(0, 3)
        .map((k) => k.romaji);
      const options = shuffle([item.romaji, ...wrong]);
      return { question: item.character, options, correctIndex: options.indexOf(item.romaji) };
    });
  }
  if (mode === 'Vocabulary') {
    const pool = shuffle([...vocabLessons1to10, ...vocabLessons11to25]);
    return pool.slice(0, count).map((item) => {
      const wrong = shuffle(pool.filter((v) => v.meaning !== item.meaning))
        .slice(0, 3)
        .map((v) => v.meaning);
      const options = shuffle([item.meaning, ...wrong]);
      return { question: item.japanese, options, correctIndex: options.indexOf(item.meaning) };
    });
  }
  const pool = shuffle([...grammar]);
  return pool.slice(0, count).map((item) => {
    const wrong = shuffle(pool.filter((g) => g.meaning !== item.meaning))
      .slice(0, 3)
      .map((g) => g.meaning);
    const options = shuffle([item.meaning, ...wrong]);
    return { question: item.pattern, options, correctIndex: options.indexOf(item.meaning) };
  });
}

function generateImportQuestions(items: ImportItem[], count: number): Question[] {
  const pool = shuffle(items);
  return pool.slice(0, count).map((item) => {
    const others = pool.filter((i) => i.meaning !== item.meaning);
    const wrong = shuffle(others).slice(0, 3).map((i) => i.meaning);
    while (wrong.length < 3) wrong.push('—');
    const options = shuffle([item.meaning, ...wrong]);
    return { question: item.kanji, options, correctIndex: options.indexOf(item.meaning) };
  });
}

export default function QuizPageWrapper() {
  return <Suspense><QuizPage /></Suspense>;
}

function QuizPage() {
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(10);
  const [finished, setFinished] = useState(false);
  const [showImportConfig, setShowImportConfig] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [questionCount, setQuestionCount] = useState(35);
  const [quizStyle, setQuizStyle] = useState<QuizStyle>('test');
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  // Quiz sets (Supabase)
  const [savedSets, setSavedSets] = useState<QuizSet[]>([]);
  const [importTab, setImportTab] = useState<'paste' | 'saved'>('saved');
  const [quizName, setQuizName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);

  const parsedImport = (() => {
    if (!importJson.trim()) return null;
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) return { error: 'JSON phải là một mảng' };
      if (parsed.length === 0) return { error: 'Mảng rỗng' };
      for (const item of parsed) {
        if (!item.kanji || !item.meaning) return { error: 'Mỗi mục phải có "kanji" và "meaning"' };
      }
      return { items: parsed as ImportItem[] };
    } catch {
      return { error: 'JSON không hợp lệ' };
    }
  })();

  // Load saved quiz sets when import config opens
  useEffect(() => {
    if (!showImportConfig) return;
    Promise.all([getQuizSets(), getQuizOrder()]).then(([sets, order]) => {
      if (order.length) {
        const sorted = [...sets].sort((a, b) => {
          const ai = order.indexOf(a.id);
          const bi = order.indexOf(b.id);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });
        setSavedSets(sorted);
      } else {
        setSavedSets(sets);
      }
    }).catch(() => {});
  }, [showImportConfig]);

  // Auto-open import mode from URL
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('mode') === 'import') {
      setMode('Import');
      setShowImportConfig(true);
    }
  }, [searchParams]);

  async function handleSaveQuizSet() {
    const importItems = parsedImport && 'items' in parsedImport ? parsedImport.items : null;
    if (!importItems || !quizName.trim()) return;
    setSaveStatus('saving');
    try {
      const saved = await saveQuizSet(quizName.trim(), importItems);
      setSavedSets((prev) => [saved, ...prev]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  async function handleDeleteSet(id: string) {
    await deleteQuizSet(id).catch(() => {});
    setSavedSets((prev) => prev.filter((s) => s.id !== id));
    setSelectedSetIds((prev) => prev.filter((sid) => sid !== id));
  }

  function startFromSavedSets() {
    const merged: ImportItem[] = [];
    for (const s of savedSets) {
      if (selectedSetIds.includes(s.id)) {
        for (const item of s.items) {
          if (!merged.find((m) => m.kanji === item.kanji)) merged.push(item);
        }
      }
    }
    if (merged.length === 0) return;
    const qs = generateImportQuestions(merged, Math.min(questionCount, merged.length));
    setQuestions(qs);
    setCurrent(0);
    setScore(0);
    setTimer(10);
    setFinished(false);
    setSubmitted(false);
    setShowImportConfig(false);
    setSelectedAnswers(new Array(qs.length).fill(-1));
  }

  function advance(correct: boolean) {
    if (correct) setScore((s) => s + 1);
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setTimer(10);
    }
  }

  useEffect(() => {
    if (!mode || finished || questions.length === 0 || showImportConfig || quizStyle === 'test') return;
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          advance(false);
          return 10;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [mode, finished, questions.length, showImportConfig, quizStyle, current]);

  function startQuiz(m: QuizMode) {
    setMode(m);
    setQuestions(generateQuestions(m));
    setCurrent(0);
    setScore(0);
    setTimer(10);
    setFinished(false);
  }

  function startImportQuiz() {
    if (!parsedImport || 'error' in parsedImport) return;
    const qs = generateImportQuestions(parsedImport.items, Math.min(questionCount, parsedImport.items.length));
    setQuestions(qs);
    setCurrent(0);
    setScore(0);
    setTimer(10);
    setFinished(false);
    setSubmitted(false);
    setShowImportConfig(false);
    setSelectedAnswers(new Array(qs.length).fill(-1));
  }

  function handleTestSubmit() {
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (selectedAnswers[i] === questions[i].correctIndex) correct++;
    }
    setScore(correct);
    setSubmitted(true);
  }

  function handleRetryWrong() {
    const wrongQs: Question[] = [];
    for (let i = 0; i < questions.length; i++) {
      if (selectedAnswers[i] !== questions[i].correctIndex) {
        wrongQs.push(questions[i]);
      }
    }
    if (wrongQs.length === 0) return;
    setQuestions(wrongQs);
    setSelectedAnswers(new Array(wrongQs.length).fill(-1));
    setCurrent(0);
    setSubmitted(false);
    setScore(0);
  }

  // === Mode selector ===
  if (!mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4">
        <h1 className="text-4xl font-bold text-gray-800">⚡ Quiz</h1>
        <p className="text-gray-500">Chọn chế độ kiểm tra</p>
        <div className="flex gap-4 flex-wrap justify-center">
          {([['Kana', 'from-pink-400 to-rose-500'], ['Vocabulary', 'from-sky-400 to-blue-500'], ['Grammar', 'from-violet-400 to-purple-500'], ['Import', 'from-emerald-400 to-teal-500']] as [QuizMode, string][]).map(([m, color]) => (
            <button
              key={m}
              onClick={() => {
                if (m === 'Import') {
                  setMode('Import');
                  setShowImportConfig(true);
                } else {
                  startQuiz(m);
                }
              }}
              className={`bg-gradient-to-r ${color} text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-lg transition-transform hover:scale-105`}
            >
              {m === 'Import' ? '📥 Import' : m}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // === Import config ===
  if (showImportConfig) {
    const importItems = parsedImport && 'items' in parsedImport ? parsedImport.items : null;
    const importError = parsedImport && 'error' in parsedImport ? parsedImport.error : null;
    const mergedCount = selectedSetIds.reduce((sum, id) => {
      const s = savedSets.find((x) => x.id === id);
      return sum + (s ? s.items.length : 0);
    }, 0);
    const isReadyPaste = importItems !== null;
    const isReadySaved = selectedSetIds.length > 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-3xl font-bold text-gray-800">✍️ Trắc nghiệm Kanji</h1>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {isAdmin && <button
            onClick={() => setImportTab('paste')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${importTab === 'paste' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
          >
            📋 Dán JSON
          </button>}
          <button
            onClick={() => setImportTab('saved')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${importTab === 'saved' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
          >
            💾 Đã lưu {savedSets.length > 0 && `(${savedSets.length})`}
          </button>
        </div>

        {importTab === 'paste' && (
          <div className="w-full max-w-lg flex flex-col gap-4">
            <p className="text-gray-500 text-sm text-center">Dán JSON danh sách kanji/vocab để tạo quiz</p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='[{ "kanji": "責任", "meaning": "せきにん (trách nhiệm)" }, ...]'
              className="w-full h-36 p-3 font-mono text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-y"
              spellCheck={false}
            />
            {importError && <p className="text-red-500 text-sm">⚠ {importError}</p>}
            {importItems && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-emerald-600 text-sm flex-1">✓ {importItems.length} mục hợp lệ</p>
                  {/* Save to Supabase */}
                  <input
                    value={quizName}
                    onChange={(e) => setQuizName(e.target.value)}
                    placeholder="Tên quiz..."
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <button
                    onClick={handleSaveQuizSet}
                    disabled={!quizName.trim() || saveStatus === 'saving'}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      saveStatus === 'saved' ? 'bg-emerald-100 text-emerald-700' :
                      saveStatus === 'error' ? 'bg-red-100 text-red-600' :
                      !quizName.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                      'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {saveStatus === 'saving' ? '...' : saveStatus === 'saved' ? '✓ Đã lưu' : saveStatus === 'error' ? '✗ Lỗi' : '💾 Lưu'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {importTab === 'saved' && (
          <div className="w-full max-w-lg flex flex-col gap-3">
            {savedSets.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Chưa có quiz nào được lưu</p>
            ) : (
              <>
                <p className="text-gray-500 text-sm text-center">Chọn một hoặc nhiều quiz để gộp lại</p>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {savedSets.map((s, idx) => {
                    const isSelected = selectedSetIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        draggable={isAdmin}
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(idx)); }}
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from === idx) return; const arr = [...savedSets]; const [item] = arr.splice(from, 1); arr.splice(idx, 0, item); setSavedSets(arr); reorderQuizSets(arr.map(s => s.id)); }}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                        onClick={() => setSelectedSetIds((prev) => isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id])}
                      >
                        {isAdmin && <span className="text-gray-300 cursor-grab active:cursor-grabbing text-lg">⠿</span>}
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-emerald-500' : 'border-2 border-gray-300'}`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm truncate">{s.name}</div>
                          <div className="text-gray-400 text-xs">{s.items.length} từ</div>
                        </div>
                        {isAdmin && <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSet(s.id); }}
                          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                        >
                          ×
                        </button>}
                      </div>
                    );
                  })}
                </div>
                {selectedSetIds.length > 0 && (
                  <p className="text-emerald-600 text-sm text-center">
                    {selectedSetIds.length} set đã chọn — {mergedCount} từ (sau khi loại trùng)
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Số câu & kiểu quiz */}
        <div className="flex flex-wrap items-center gap-4 justify-center">
          <div className="flex items-center gap-2">
            <label className="text-gray-600 text-sm">Số câu:</label>
            <input
              type="number"
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="w-20 text-center border border-gray-200 rounded-lg p-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setQuizStyle('test')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${quizStyle === 'test' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              📝 Trắc nghiệm
            </button>
            <button onClick={() => setQuizStyle('instant')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${quizStyle === 'instant' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              ⚡ Tức thì
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setMode(null); setShowImportConfig(false); }}
            className="bg-white border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl shadow-sm"
          >
            ← Quay lại
          </button>
          {importTab === 'paste' ? (
            <button
              onClick={startImportQuiz}
              disabled={!isReadyPaste}
              className={`bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all ${!isReadyPaste ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              Bắt đầu →
            </button>
          ) : (
            <button
              onClick={startFromSavedSets}
              disabled={!isReadySaved}
              className={`bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all ${!isReadySaved ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              Bắt đầu →
            </button>
          )}
        </div>
      </div>
    );
  }

  // === Test quiz (chưa submit) ===
  const isTestMode = mode === 'Import' && quizStyle === 'test' && !submitted;

  if (isTestMode) {
    const q = questions[current];
    const answeredCount = selectedAnswers.filter((a) => a !== -1).length;
    const isLast = current + 1 >= questions.length;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 pb-24">
        {/* Progress bar */}
        <div className="w-full max-w-lg">
          <div className="flex justify-between text-gray-500 text-sm mb-1">
            <span>📥 Import</span>
            <span>Câu {current + 1}/{questions.length}</span>
            <span className="text-emerald-500">{answeredCount}/{questions.length} đã chọn</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300 rounded-full" style={{ width: `${((answeredCount) / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
          <div className="text-4xl font-bold text-gray-800 min-h-[3rem] flex items-center">{q.question}</div>
          <div className="grid grid-cols-2 gap-3 w-full">
            {q.options.map((opt, i) => {
              const isSelected = selectedAnswers[current] === i;
              return (
                <button
                  key={i}
                  onClick={() => {
                    const next = [...selectedAnswers];
                    next[current] = i;
                    setSelectedAnswers(next);
                  }}
                  className={`font-semibold py-4 px-4 rounded-xl transition-all text-sm shadow-sm ${
                    isSelected
                      ? 'bg-emerald-500 text-white border-2 border-emerald-500'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col items-center gap-3 w-full max-w-lg">
          {/* Pagination dots */}
          <div className="flex flex-wrap gap-1 justify-center">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                  i === current
                    ? 'bg-emerald-500 text-white scale-110'
                    : selectedAnswers[i] !== -1
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {/* Prev / Next buttons */}
          <div className="flex gap-3 w-full justify-between">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${current === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              ← Câu trước
            </button>
            {isLast ? (
              <button
                onClick={handleTestSubmit}
                disabled={answeredCount < questions.length}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  answeredCount < questions.length
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg hover:scale-105'
                }`}
              >
                📝 Nộp bài
              </button>
            ) : (
              <button
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                className="px-6 py-3 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
              >
                Câu sau →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === Test results (đã submit) ===
  if (submitted && mode === 'Import' && quizStyle === 'test') {
    const total = questions.length;
    const correct = score;
    const wrong = total - correct;
    const pct = Math.round((correct / total) * 100);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 pb-24">
        <h1 className="text-3xl font-bold text-gray-800">🎉 Kết quả</h1>
        <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">{pct}%</div>
        <p className="text-gray-600 text-xl">
          ✅ {correct} / {total} đúng
          {wrong > 0 && <span className="text-red-400 ml-2">❌ {wrong} sai</span>}
        </p>

        {/* Danh sách câu hỏi */}
        <div className="w-full max-w-lg space-y-2 max-h-80 overflow-y-auto">
          {questions.map((q, i) => {
            const isCorrect = selectedAnswers[i] === q.correctIndex;
            return (
              <div key={i} className={`p-3 rounded-xl border-2 text-sm ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start gap-2">
                  <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>{isCorrect ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{q.question}</div>
                    <div className="text-gray-500 mt-1">
                      {isCorrect ? (
                        <span className="text-emerald-600">✓ {q.options[q.correctIndex]}</span>
                      ) : (
                        <span>
                          <span className="text-red-500 line-through mr-2">{q.options[selectedAnswers[i]]}</span>
                          <span className="text-emerald-600">✓ {q.options[q.correctIndex]}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setShowImportConfig(true); setSubmitted(false); }}
            className="bg-white border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl shadow-sm"
          >
            Nhập lại
          </button>
          {wrong > 0 && (
            <button
              onClick={handleRetryWrong}
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              🔄 Làm lại {wrong} câu sai
            </button>
          )}
          <button
            onClick={() => { setMode(null); setSubmitted(false); }}
            className="bg-white border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl shadow-sm"
          >
            Đổi mode
          </button>
        </div>
      </div>
    );
  }

  // === Finished (instant mode) ===
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-4xl font-bold text-gray-800">🎉 Kết quả</h1>
        <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">{pct}%</div>
        <p className="text-gray-600 text-xl">{score} / {questions.length} đúng</p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => mode === 'Import' ? setShowImportConfig(true) : startQuiz(mode)}
            className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold py-3 px-6 rounded-xl shadow"
          >
            Thử lại
          </button>
          <button onClick={() => setMode(null)} className="bg-white border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl shadow-sm">
            Đổi mode
          </button>
        </div>
      </div>
    );
  }

  // === Instant quiz in progress ===
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 pb-24">
      <div className="w-full max-w-lg flex justify-between text-gray-500 text-sm">
        <span className="font-medium">{mode === 'Import' ? '📥 Import' : mode}</span>
        <span>Câu {current + 1}/{questions.length}</span>
        <span className="font-medium text-emerald-500">✓ {score}</span>
      </div>
      <div className="w-full max-w-lg h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 rounded-full" style={{ width: `${(timer / 10) * 100}%` }} />
      </div>
      <div className="text-gray-400 text-sm">{timer}s</div>
      <QuizCard
        question={questions[current].question}
        options={questions[current].options}
        correctIndex={questions[current].correctIndex}
        onAnswer={advance}
      />
    </div>
  );
}
