'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sessionKanji, SessionKanjiEntry } from '@/data/session-kanji';
import { getSessionData, getAllSessionData } from '@/lib/session-data';
import { speak } from '@/lib/speak';
import { addKanjiToSRS, reviewKanji } from '@/lib/kanji-srs-store';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wrap first occurrence of target in 【】 */
function bracketTarget(text: string, target?: string): string {
  if (!target || !text) return text ? `【${text}】` : '';
  const i = text.indexOf(target);
  if (i === -1) return `【${text}】`;
  return text.slice(0, i) + '【' + target + '】' + text.slice(i + target.length);
}

/** Highlight a substring without HTML injection */
function highlightParts(
  text: string,
  target?: string
): { before: string; mid: string; after: string } | null {
  if (!text || !target) return null;
  const i = text.toLowerCase().indexOf(target.toLowerCase());
  if (i === -1) return null;
  return {
    before: text.slice(0, i),
    mid: text.slice(i, i + target.length),
    after: text.slice(i + target.length),
  };
}

function countValidVocab(entries: SessionKanjiEntry[]): number {
  return entries.reduce(
    (sum, k) => sum + (k.vocab || []).filter((v) => v && v.word?.trim() && v.reading?.trim()).length,
    0
  );
}

type QuizMode = 'study' | 'exam' | 'hard';
type Phase = 'config' | 'quiz' | 'result';

type VocabItem = {
  word: string;
  reading: string;
  meaning: string;
  highlight?: string;
  highlightMeaning?: string;
  highlightReading?: string;
  kanji: string;
  hanViet: string;
  onyomi?: string;
  kunyomi?: string;
};

type Question = {
  type: 'reading-to-kanji' | 'kanji-to-reading';
  /** Vietnamese meaning (study only in prompt; always in explanation) */
  sentence: string;
  /** Main prompt string (reading or word) */
  highlight: string;
  highlightMeaning?: string;
  /** Kanji portion shown in 【】 for 読み方 / hard */
  vocabHighlight?: string;
  /** Reading portion shown in 【】 for 漢字表記 */
  highlightReading?: string;
  correctAnswer: string;
  options: string[];
  card: VocabItem;
  /** Text to speak in study mode */
  speakText: string;
};

/** Prefer focused reading (highlightReading); else full reading */
function readingOf(v: Pick<VocabItem, 'reading' | 'highlightReading'>): string {
  return (v.highlightReading || v.reading || '').trim();
}

/** Short readings suitable as distractors for focused 読み questions */
function shortReadingCandidates(v: VocabItem): string[] {
  const out: string[] = [];
  if (v.highlightReading?.trim()) out.push(v.highlightReading.trim());
  // Single-word-ish cards: full reading is fine as a short option
  if (v.word && v.word.length <= 6 && v.reading?.trim()) out.push(v.reading.trim());
  for (const raw of [v.onyomi, v.kunyomi]) {
    if (!raw) continue;
    for (const part of raw.split(/[、,.\s／/]+/)) {
      const t = part.replace(/[-.ー]/g, '').trim();
      if (t.length >= 1 && t.length <= 8) out.push(t);
    }
  }
  return out;
}

function kanjiPromptOf(v: VocabItem): string {
  if (v.highlight && v.highlightReading) return v.highlight;
  if (v.highlight) return v.highlight;
  return v.word || v.kanji;
}

function pickUniqueOptions(correct: string, wrongs: string[], n = 4): string[] {
  const seen = new Set<string>([correct.trim()]);
  const unique: string[] = [];
  for (const w of wrongs) {
    const t = (w || '').trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    unique.push(t);
    if (unique.length >= n - 1) break;
  }
  if (unique.length === 0) return [correct];
  return shuffle([correct, ...unique]);
}

/** Prefer distractors with similar length to the correct answer */
function rankBySimilarity(correct: string, candidates: string[]): string[] {
  const targetLen = correct.length;
  return [...candidates].sort(
    (a, b) => Math.abs(a.length - targetLen) - Math.abs(b.length - targetLen)
  );
}

/**
 * Build wrong kanji writings by substituting the target kanji/compound in the word.
 * Tries full target first, then each character of the target.
 */
function makeWrongKanjiWords(word: string, targetKanji: string, otherKanji: string[]): string[] {
  if (!word || !targetKanji) return [];
  const out: string[] = [];
  const seen = new Set<string>();

  const tryReplace = (needle: string, replacement: string) => {
    if (!needle || !word.includes(needle) || replacement === needle) return;
    const replaced = word.replace(new RegExp(escapeRegex(needle), 'g'), replacement);
    if (replaced && replaced !== word && !seen.has(replaced)) {
      seen.add(replaced);
      out.push(replaced);
    }
  };

  for (const k of otherKanji) {
    if (!k || k === targetKanji) continue;
    tryReplace(targetKanji, k);
  }

  // Per-character substitution (e.g. 幸 in 幸せ)
  if (targetKanji.length > 1) {
    for (const ch of [...targetKanji]) {
      for (const k of otherKanji) {
        if (!k || k === ch) continue;
        // Use first char of other kanji entry when multi-char
        const rep = [...k][0];
        if (rep) tryReplace(ch, rep);
      }
    }
  }

  return out;
}

function flattenVocab(kanjiData: SessionKanjiEntry[]): VocabItem[] {
  return kanjiData.flatMap((k) =>
    (k.vocab || [])
      .filter((v) => v && v.word?.trim() && v.reading?.trim())
      .map((v) => ({
        word: v.word.trim(),
        reading: v.reading.trim(),
        meaning: (v.meaning || '').trim(),
        highlight: v.highlight?.trim() || undefined,
        highlightMeaning: v.highlightMeaning?.trim() || undefined,
        highlightReading: v.highlightReading?.trim() || undefined,
        kanji: k.kanji,
        hanViet: k.hanViet,
        onyomi: k.onyomi,
        kunyomi: k.kunyomi,
      }))
  );
}

function generateJLPTQuestions(
  kanjiData: SessionKanjiEntry[],
  mode: QuizMode,
  count = 35
): Question[] {
  const allVocab = flattenVocab(kanjiData);
  if (allVocab.length === 0) return [];

  // Random unique sample first; only cycle if count > pool
  const pool = shuffle(allVocab);
  const picked: VocabItem[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(pool[i % pool.length]);
  }

  const otherKanjiList = shuffle([...new Set(kanjiData.map((k) => k.kanji).filter(Boolean))]);

  // Global short-reading pool for distractors
  const allShortReadings = shuffle(
    [...new Set(allVocab.flatMap((v) => shortReadingCandidates(v)).filter(Boolean))]
  );

  const questions: Question[] = [];

  for (const vocab of picked) {
    const targetKanji = vocab.highlight || vocab.kanji;
    const targetReading = readingOf(vocab);
    const fullReading = vocab.reading;
    const focused = Boolean(vocab.highlightReading);
    const card = vocab;

    if (mode === 'hard') {
      const prompt = kanjiPromptOf(vocab);
      const correct = targetReading;
      const wrongPool = focused
        ? rankBySimilarity(
            correct,
            allShortReadings.filter((r) => r !== correct)
          )
        : rankBySimilarity(
            correct,
            allVocab.map(readingOf).filter((r) => r && r !== correct)
          );
      const options = pickUniqueOptions(correct, wrongPool, 4);
      if (options.length < 2) continue;
      questions.push({
        type: 'kanji-to-reading',
        sentence: vocab.meaning,
        highlight: prompt,
        vocabHighlight: prompt,
        correctAnswer: correct,
        options,
        card,
        speakText: correct,
      });
      continue;
    }

    const isReadingToKanji = Math.random() < 0.5;

    if (isReadingToKanji) {
      const correct = vocab.word;
      const wrongs = makeWrongKanjiWords(
        vocab.word,
        targetKanji,
        shuffle(otherKanjiList.filter((k) => k !== targetKanji && k !== vocab.kanji))
      );
      // Fallback only if substitution produced too few
      const extraWrongs =
        wrongs.length < 3
          ? allVocab.filter((v) => v.word !== correct).map((v) => v.word)
          : [];
      const options = pickUniqueOptions(correct, [...wrongs, ...shuffle(extraWrongs)], 4);
      if (options.length < 2) continue;
      questions.push({
        type: 'reading-to-kanji',
        sentence: vocab.meaning,
        highlight: fullReading,
        highlightMeaning: vocab.highlightMeaning,
        highlightReading: vocab.highlightReading || undefined,
        vocabHighlight: targetKanji,
        correctAnswer: correct,
        options,
        card,
        speakText: fullReading,
      });
    } else {
      const correct = targetReading;
      const wrongPool = focused
        ? rankBySimilarity(
            correct,
            allShortReadings.filter((r) => r !== correct)
          )
        : rankBySimilarity(
            correct,
            allVocab.map(readingOf).filter((r) => r && r !== correct)
          );
      const options = pickUniqueOptions(correct, wrongPool, 4);
      if (options.length < 2) continue;
      questions.push({
        type: 'kanji-to-reading',
        sentence: vocab.meaning,
        highlight: vocab.word,
        highlightMeaning: vocab.highlightMeaning,
        vocabHighlight: targetKanji,
        highlightReading: vocab.highlightReading || undefined,
        correctAnswer: correct,
        options,
        card,
        speakText: correct,
      });
    }
  }

  return shuffle(questions);
}

function BackButton({
  onClick,
  href,
  label = 'Quay lại',
  className = '',
}: {
  onClick?: () => void;
  href?: string;
  label?: string;
  className?: string;
}) {
  const cls = `text-sm text-gray-500 hover:text-indigo-500 transition-colors inline-flex items-center gap-1 ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        <span aria-hidden>←</span> {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <span aria-hidden>←</span> {label}
    </button>
  );
}

export default function JLPTQuizPage() {
  const router = useRouter();
  const [quizMode, setQuizMode] = useState<QuizMode>('study');
  const [phase, setPhase] = useState<Phase>('config');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCards, setWrongCards] = useState<Question[]>([]);
  const [showExample, setShowExample] = useState(false);
  const [questionCount, setQuestionCount] = useState(20);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countingVocab, setCountingVocab] = useState(false);
  const [startError, setStartError] = useState('');
  const [allSessions, setAllSessions] = useState<Map<number, number>>(new Map());
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());
  const [totalVocab, setTotalVocab] = useState(0);
  const kanjiCacheRef = useRef<Map<number, SessionKanjiEntry[]>>(new Map());
  const answerStartRef = useRef(Date.now());

  function goBackHome() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }

  useEffect(() => {
    setMounted(true);
    loadSessions();
  }, []);

  // Reset answer timer when question changes
  useEffect(() => {
    if (phase === 'quiz') answerStartRef.current = Date.now();
  }, [idx, phase]);

  async function loadSessions() {
    const dbSessions = await getAllSessionData();
    const kanjiSessions = dbSessions.filter((s) => s.type === 'kanji');
    const map = new Map<number, number>();
    Object.entries(sessionKanji).forEach(([k, v]) => map.set(Number(k), v.length));
    kanjiSessions.forEach((s) => map.set(s.session_num, (map.get(s.session_num) || 0) + s.count));
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('nihongo_custom_kanji_'))
        .forEach((key) => {
          const num = parseInt(key.replace('nihongo_custom_kanji_', ''), 10);
          if (Number.isNaN(num)) return;
          try {
            const data = JSON.parse(localStorage.getItem(key) || '');
            if (data.cards) map.set(num, (map.get(num) || 0) + data.cards.length);
          } catch {
            /* ignore */
          }
        });
    }
    setAllSessions(map);
    setSelectedSessions(new Set(map.keys()));
  }

  const loadKanjiForSessions = useCallback(async (sessions: number[]): Promise<SessionKanjiEntry[]> => {
    const all: SessionKanjiEntry[] = [];
    for (const s of sessions) {
      if (kanjiCacheRef.current.has(s)) {
        all.push(...kanjiCacheRef.current.get(s)!);
        continue;
      }
      const base = (sessionKanji[s] || []).map((c) => ({ ...c, vocab: c.vocab || [] }));
      const dbData = ((await getSessionData(s, 'kanji')) as SessionKanjiEntry[]).map((c) => ({
        ...c,
        vocab: c.vocab || [],
      }));
      let custom: SessionKanjiEntry[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`nihongo_custom_kanji_${s}`);
          if (raw) {
            const data = JSON.parse(raw);
            if (data.cards) {
              custom = data.cards.map((c: SessionKanjiEntry) => ({ ...c, vocab: c.vocab || [] }));
            }
          }
        } catch {
          /* ignore */
        }
      }
      const combined = [...base, ...dbData, ...custom];
      kanjiCacheRef.current.set(s, combined);
      all.push(...combined);
    }
    return all;
  }, []);

  // Count actual vocab for selected sessions (questions are per-vocab, not per-kanji)
  const selectedKey = useMemo(
    () => [...selectedSessions].sort((a, b) => a - b).join(','),
    [selectedSessions]
  );

  useEffect(() => {
    if (!mounted) return;
    const sessions = selectedKey ? selectedKey.split(',').map(Number) : [];
    if (sessions.length === 0) {
      setTotalVocab(0);
      return;
    }
    let cancelled = false;
    setCountingVocab(true);
    loadKanjiForSessions(sessions)
      .then((data) => {
        if (cancelled) return;
        setTotalVocab(countValidVocab(data));
      })
      .finally(() => {
        if (!cancelled) setCountingVocab(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedKey, mounted, loadKanjiForSessions]);

  // Clamp questionCount when vocab pool shrinks
  useEffect(() => {
    if (totalVocab > 0 && questionCount > totalVocab) {
      setQuestionCount(totalVocab);
    }
  }, [totalVocab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function startQuiz() {
    const sessions = [...selectedSessions];
    if (sessions.length === 0) return;
    setLoading(true);
    setStartError('');
    try {
      const kanjiData = await loadKanjiForSessions(sessions);
      const vocabN = countValidVocab(kanjiData);
      if (vocabN < 2) {
        setStartError(
          'Không đủ từ vựng để tạo đề (cần ≥ 2 mục có word + reading). Kiểm tra data kanji của các buổi đã chọn.'
        );
        return;
      }
      const want = Math.max(1, questionCount);
      const qs = generateJLPTQuestions(kanjiData, quizMode, want);
      if (qs.length === 0) {
        setStartError('Không tạo được câu hỏi. Cần vocab.word + reading, và đủ distractor.');
        return;
      }
      // Seed SRS for kanji appearing in this quiz
      const seen = new Set<string>();
      for (const q of qs) {
        if (q.card.kanji && !seen.has(q.card.kanji)) {
          seen.add(q.card.kanji);
          addKanjiToSRS(q.card.kanji);
        }
      }
      setQuestions(qs);
      setIdx(0);
      setScore(0);
      setSelected(null);
      setWrongCards([]);
      setShowExample(false);
      setPhase('quiz');
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
    const q = questions[idx];
    const isCorrect = q.options[i] === q.correctAnswer;
    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      setWrongCards((prev) => [...prev, q]);
    }
    // Sync with daily-review SRS
    if (q.card.kanji) {
      const ms = Date.now() - answerStartRef.current;
      reviewKanji(q.card.kanji, isCorrect, ms);
    }
    // Always show explanation (incl. wrong answers)
    setShowExample(true);
  }

  function goNext() {
    setSelected(null);
    setShowExample(false);
    if (idx + 1 >= questions.length) {
      setPhase('result');
      setIdx(questions.length);
    } else {
      setIdx((prev) => prev + 1);
    }
  }

  function resetToConfig() {
    setPhase('config');
    setQuestions([]);
    setIdx(0);
    setScore(0);
    setWrongCards([]);
    setSelected(null);
    setShowExample(false);
    setStartError('');
  }

  function retryAll() {
    setQuestions(shuffle([...questions]));
    setIdx(0);
    setScore(0);
    setWrongCards([]);
    setSelected(null);
    setShowExample(false);
    setPhase('quiz');
  }

  function retryWrong() {
    if (wrongCards.length === 0) return;
    setQuestions(shuffle([...wrongCards]));
    setIdx(0);
    setScore(0);
    setWrongCards([]);
    setSelected(null);
    setShowExample(false);
    setPhase('quiz');
  }

  function toggleSession(s: number) {
    const next = new Set(selectedSessions);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setSelectedSessions(next);
  }

  // Keyboard: 1–4 answer, Enter next
  useEffect(() => {
    if (phase !== 'quiz') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if (showExample && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        goNext();
        return;
      }
      if (selected !== null) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4 && questions[idx]?.options[num - 1] !== undefined) {
        e.preventDefault();
        handleSelect(num - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showExample, selected, idx, questions]);

  if (!mounted) return null;

  const totalKanji = [...selectedSessions].reduce((sum, s) => sum + (allSessions.get(s) || 0), 0);
  const maxQuestions = Math.max(totalVocab || totalKanji, 1);
  const effectiveCount = Math.min(questionCount, maxQuestions);

  // === RESULT ===
  if (phase === 'result') {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center max-w-md mx-auto">
        <div className="w-full mb-3">
          <BackButton onClick={resetToConfig} label="Quay lại cài đặt" />
        </div>
        <p className="text-5xl mb-4">🏆</p>
        <p className="text-xl font-bold text-gray-800">Kết quả JLPT Quiz</p>
        <p className="text-3xl font-bold text-indigo-600 mt-3">
          {score}/{questions.length}
        </p>
        <p className="text-sm text-gray-500 mt-1">{pct}% đúng</p>
        <p className="text-xs text-gray-400 mt-2">Đã cập nhật SRS Kanji (ôn hàng ngày)</p>
        <div className="flex gap-3 mt-6 flex-wrap justify-center">
          <button
            onClick={retryAll}
            className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow"
          >
            🔄 Làm lại
          </button>
          {wrongCards.length > 0 && (
            <button
              onClick={retryWrong}
              className="px-5 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl font-medium shadow"
            >
              🔄 Làm lại câu sai ({wrongCards.length})
            </button>
          )}
          <button onClick={resetToConfig} className="px-5 py-2 bg-gray-200 rounded-xl font-medium">
            Cài đặt
          </button>
        </div>
        {wrongCards.length > 0 && (
          <div className="mt-8 w-full text-left">
            <h2 className="font-semibold text-red-500 mb-3">❌ Câu sai ({wrongCards.length})</h2>
            <div className="space-y-2">
              {wrongCards.map((c, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-3 border border-red-100 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-gray-800">{c.vocabHighlight || c.highlight}</span>
                    <span className="text-sm text-gray-500 ml-2">— {c.correctAnswer}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 max-w-[40%] truncate">{c.sentence}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // === CONFIG ===
  if (phase === 'config') {
    return (
      <div className="min-h-screen p-4 pb-24 max-w-md mx-auto">
        <BackButton onClick={goBackHome} className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-800 mb-1">📝 JLPT Kanji Quiz</h1>
        <p className="text-sm text-gray-500 mb-6">
          {allSessions.size} buổi, {[...allSessions.values()].reduce((a, b) => a + b, 0)} kanji
        </p>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              📚 <span>Chọn buổi</span>
            </span>
            <button
              onClick={() =>
                setSelectedSessions(
                  selectedSessions.size === allSessions.size ? new Set() : new Set(allSessions.keys())
                )
              }
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 transition-all"
            >
              {selectedSessions.size === allSessions.size ? '🗑 Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...allSessions.keys()]
              .sort((a, b) => a - b)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSession(s)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    selectedSessions.has(s) ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  style={selectedSessions.has(s) ? { background: '#6C63FF' } : {}}
                >
                  Buổi {s} <span className="opacity-70">({allSessions.get(s)})</span>
                </button>
              ))}
          </div>
          {selectedSessions.size > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Đã chọn {selectedSessions.size} buổi —{' '}
              <strong>{totalKanji}</strong> kanji
              {countingVocab ? (
                <span> · đang đếm từ…</span>
              ) : (
                <span>
                  {' '}
                  · <strong>{totalVocab}</strong> từ vựng (câu hỏi)
                </span>
              )}
            </p>
          )}
        </div>

        <hr className="border-gray-100 mb-6" />

        <div className="mb-6">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mb-3">
            🎯 <span>Chọn dạng</span>
          </span>
          <div className="flex flex-col gap-1.5">
            {(
              [
                { key: 'study' as QuizMode, label: '📖 Học', desc: 'Có nghĩa + giải thích + audio' },
                { key: 'exam' as QuizMode, label: '📝 Luyện thi', desc: 'Không nghĩa / không audio (dạng JLPT)' },
                { key: 'hard' as QuizMode, label: '🔥 Khó', desc: 'Chỉ kanji → chọn cách đọc ngắn' },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => setQuizMode(m.key)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition-all ${
                  quizMode === m.key ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={quizMode === m.key ? { background: '#6C63FF' } : {}}
              >
                <span className="text-base">
                  {quizMode === m.key ? '✓ ' : ''}
                  {m.label}
                </span>
                <span className={`text-xs ${quizMode === m.key ? 'text-white/70' : 'text-gray-400'}`}>{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <hr className="border-gray-100 mb-6" />

        <div className="mb-6">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mb-3">
            🔢 <span>Số câu hỏi</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={Math.max(maxQuestions, 1)}
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(Math.max(1, Math.min(Math.max(maxQuestions, 1), Number(e.target.value) || 1)))
              }
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-center"
            />
            <span className="text-xs text-gray-400">
              / {countingVocab ? '…' : totalVocab || maxQuestions} từ
            </span>
            <button
              onClick={() => setQuestionCount(Math.max(totalVocab || totalKanji, 1))}
              className="text-xs px-3 py-1.5 rounded-xl font-medium text-white shadow-sm"
              style={{ background: '#6C63FF' }}
            >
              Tất cả
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">Số câu dựa trên từ vựng (vocab), không phải số thẻ kanji.</p>
        </div>

        {startError && (
          <p className="mb-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{startError}</p>
        )}

        <button
          onClick={startQuiz}
          disabled={totalKanji < 1 || totalVocab < 2 || loading || countingVocab || selectedSessions.size === 0}
          className="w-full py-4 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
        >
          <span className="text-base">{loading ? '⏳ Đang tạo đề...' : '🚀 Bắt đầu'}</span>
          <span className="block text-xs font-normal mt-0.5 opacity-80">
            {effectiveCount} câu • {totalVocab || '…'} từ • {totalKanji} kanji •{' '}
            {{ study: 'Học', exam: 'Luyện thi', hard: 'Khó' }[quizMode]}
          </span>
        </button>
      </div>
    );
  }

  // === QUIZ ===
  if (questions.length === 0 || !questions[idx]) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center text-gray-500">Đang tạo đề...</div>
    );
  }

  const q = questions[idx];
  const isExam = quizMode === 'exam';
  const isHard = quizMode === 'hard';
  const opts = ['①', '②', '③', '④'];
  const isCorrectSelected = selected !== null && q.options[selected] === q.correctAnswer;
  const meaningParts = highlightParts(q.sentence, q.highlightMeaning);

  const readingStem = bracketTarget(q.highlight, q.highlightReading);
  const kanjiStem =
    !isHard && q.vocabHighlight && q.highlight.includes(q.vocabHighlight)
      ? bracketTarget(q.highlight, q.vocabHighlight)
      : `【${q.vocabHighlight || q.highlight}】`;

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2 gap-2">
          <BackButton onClick={resetToConfig} label="Thoát" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-gray-800 truncate">
              {{ study: '📖 Học', exam: '📝 Luyện thi', hard: '🔥 Khó' }[quizMode]}
            </span>
            {!isHard && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 shrink-0">
                {q.type === 'reading-to-kanji' ? '漢字表記' : '読み方'}
              </span>
            )}
          </div>
          <span className="text-xs text-emerald-600 font-semibold shrink-0">✓ {score}</span>
        </div>

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div
            className="h-full rounded-full transition-all duration-300 flex items-center justify-end pr-1"
            style={{
              width: `${((idx + 1) / questions.length) * 100}%`,
              background: '#6C63FF',
              minWidth: '24px',
            }}
          >
            {((idx + 1) / questions.length) * 100 > 15 && (
              <span className="text-[9px] text-white font-bold">
                {idx + 1}/{questions.length}
              </span>
            )}
          </div>
        </div>
        {((idx + 1) / questions.length) * 100 <= 15 && (
          <p className="text-[10px] text-gray-400 mb-1">
            {idx + 1}/{questions.length}
          </p>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
          {/* Meaning — study only, once, no HTML */}
          {!isExam && !isHard && q.sentence && (
            <p className="text-xs text-gray-400 mb-3 text-center">
              {meaningParts ? (
                <>
                  {meaningParts.before}
                  <span className="font-semibold text-gray-600">{meaningParts.mid}</span>
                  {meaningParts.after}
                </>
              ) : (
                q.sentence
              )}
            </p>
          )}

          {q.type === 'reading-to-kanji' ? (
            <div className="text-center py-3">
              <div className="inline-block px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl max-w-full">
                <p className="text-xl sm:text-2xl font-bold text-amber-900 leading-relaxed break-words">
                  {readingStem}
                </p>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Chọn cách viết kanji đúng</p>
            </div>
          ) : (
            <div className="text-center py-3">
              <div className="inline-block px-5 py-2 bg-amber-50 border border-amber-200 rounded-xl max-w-full">
                <span className="text-2xl sm:text-3xl font-bold text-gray-800 break-words">{kanjiStem}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Chọn cách đọc đúng</p>
            </div>
          )}

          {/* Audio: study only (exam/hard would spoil) */}
          {!isExam && !isHard && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => speak(q.speakText)}
                className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-150"
                aria-label="Nghe"
              >
                <span className="text-xl">🔊</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            let cls = 'bg-white border-2 border-gray-200 hover:border-indigo-300 scale-100';
            if (selected !== null) {
              if (opt === q.correctAnswer)
                cls = 'bg-emerald-100 border-emerald-500 border-[3px] text-emerald-800 font-bold scale-[1.02] pop';
              else if (i === selected) cls = 'bg-red-100 border-red-500 border-[3px] text-red-700 shake';
            }
            const circleCls =
              selected !== null && opt === q.correctAnswer
                ? 'bg-emerald-500 text-white'
                : selected !== null && i === selected
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-500';
            return (
              <button
                key={i}
                disabled={selected !== null}
                onClick={() => handleSelect(i)}
                className={`${cls} w-full py-3.5 px-4 rounded-xl font-medium text-left transition-all duration-200 shadow-sm flex items-center gap-3`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${circleCls}`}
                >
                  {selected !== null && opt === q.correctAnswer ? '✓' : opts[i]}
                </span>
                <span
                  className={`text-base sm:text-lg break-words ${selected !== null && opt === q.correctAnswer ? 'font-bold' : ''}`}
                >
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {showExample && (
          <div
            className={`mt-4 rounded-xl p-4 border ${
              isCorrectSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`text-sm font-bold mb-2 flex items-center gap-1 ${
                isCorrectSelected ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {isCorrectSelected ? '✅ Chính xác' : '✗ Sai'}
            </p>
            <div className="bg-white rounded-lg p-3 border border-gray-100 space-y-1.5">
              <p className="text-lg font-bold text-gray-800">
                {q.card.word || q.highlight}
                <span className="text-sm font-normal text-gray-500 ml-2">（{q.card.reading}）</span>
              </p>
              {q.card.highlight && q.card.highlightReading && (
                <p className="text-sm text-indigo-600">
                  【{q.card.highlight}】→ {q.card.highlightReading}
                </p>
              )}
              {q.card.hanViet && <p className="text-xs text-gray-400">{q.card.hanViet}</p>}
              {q.sentence && <p className="text-xs text-gray-500 leading-relaxed">{q.sentence}</p>}
            </div>
            {!isCorrectSelected && (
              <p className="text-xs text-red-500 mt-2">
                Đáp án đúng: <span className="font-bold">{q.correctAnswer}</span>
              </p>
            )}
            <button
              onClick={goNext}
              className="mt-3 w-full py-2.5 text-white rounded-lg text-sm font-medium shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
              style={{ background: '#6C63FF' }}
            >
              {idx + 1 >= questions.length ? 'Xem kết quả' : 'Tiếp →'}
              <span className="opacity-70 font-normal text-[11px] ml-1">(Enter)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
