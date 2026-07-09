'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { speak } from '@/lib/speak';
import { sessionKanji, SessionKanjiEntry } from '@/data/session-kanji';
import { getSessionData, deleteSessionItem, deleteAllSessionData } from '@/lib/session-data';
import { supabase } from '@/lib/supabase';
import { addKanjiToSRS, reviewKanji } from '@/lib/kanji-srs-store';

type Mode = 'flashcard' | 'quiz' | 'viewall';
type QuizQ = {
  question: string;
  reading: string;
  word: string;
  correctKanji: string;
  options: string[];
  meaning: string;
};

function toHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeCard(c: SessionKanjiEntry): SessionKanjiEntry {
  return {
    ...c,
    kanji: (c.kanji || '').trim(),
    hanViet: c.hanViet || '',
    meaning: c.meaning || '',
    vocab: Array.isArray(c.vocab) ? c.vocab : [],
  };
}

/** Highlight first match of target in text as amber spans (no HTML injection) */
function highlightText(text: string, target?: string): ReactNode {
  if (!text) return null;
  if (!target) return text;
  try {
    const re = new RegExp(`(${escapeRegex(target)})`, 'gi');
    const parts = text.split(re);
    const lower = target.toLowerCase();
    return parts.map((p, i) =>
      p.toLowerCase() === lower ? (
        <span key={i} className="text-amber-500 font-medium">
          {p}
        </span>
      ) : (
        p
      )
    );
  } catch {
    return text;
  }
}

function highlightMnemonic(text: string, light = false): ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <span key={i} className={light ? 'text-amber-300 font-bold' : 'font-bold text-amber-600'}>
          {p.slice(2, -2)}
        </span>
      );
    }
    return p;
  });
}

function highlightReading(reading: string, highlightReading?: string, onyomi?: string, kunyomi?: string): ReactNode {
  const hl = highlightReading || toHiragana(onyomi || '') || toHiragana(kunyomi || '');
  if (!hl) return reading;
  try {
    const parts = reading.split(new RegExp(`(${escapeRegex(hl)})`, 'g'));
    const lower = hl.toLowerCase();
    return parts.map((p, j) =>
      p.toLowerCase() === lower ? (
        <span key={j} className="text-amber-500 font-medium">
          {p}
        </span>
      ) : (
        p
      )
    );
  } catch {
    return reading;
  }
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function BackLink({ sessionId }: { sessionId: number }) {
  return (
    <Link
      href={`/schedule/${sessionId}`}
      className="text-sm text-gray-500 hover:text-indigo-500 transition-colors inline-flex items-center gap-1"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Quay lại
    </Link>
  );
}

export default function SessionKanjiPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const sessionId = parseInt(String(id), 10);

  const baseCards = useMemo(
    () => (Number.isFinite(sessionId) ? (sessionKanji[sessionId] || []).map(normalizeCard) : []),
    [sessionId]
  );

  const [cards, setCards] = useState<SessionKanjiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<Mode>('flashcard');
  const [isShuffled, setIsShuffled] = useState(false);
  const [managing, setManaging] = useState(false);
  const [editJson, setEditJson] = useState(false);
  const [editJsonText, setEditJsonText] = useState('');
  const [editJsonError, setEditJsonError] = useState('');
  const [editingMnemonic, setEditingMnemonic] = useState(false);
  const [mnemonicText, setMnemonicText] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SessionKanjiEntry | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQ[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [qSelected, setQSelected] = useState<number | null>(null);
  const [qScore, setQScore] = useState(0);
  const [showQuizExplain, setShowQuizExplain] = useState(false);
  const [quizError, setQuizError] = useState('');
  const answerStartRef = useRef(Date.now());

  // Invalid session id
  if (!Number.isFinite(sessionId) || sessionId < 1) {
    notFound();
  }

  const loadCards = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const mnemoKey = `kanji_mnemonic_${sessionId}`;
      const overrideKey = `kanji_card_override_${sessionId}`;
      const mnemoMap = safeParseJson<Record<string, string>>(localStorage.getItem(mnemoKey), {});
      const overrideMap = safeParseJson<Record<string, SessionKanjiEntry>>(localStorage.getItem(overrideKey), {});

      const deletedBase = new Set(
        safeParseJson<string[]>(localStorage.getItem(`kanji_deleted_base_${sessionId}`), [])
      );

      let merged = baseCards
        .filter((c) => c.kanji && !deletedBase.has(c.kanji))
        .map((c) => {
          const ov = overrideMap[c.kanji];
          const base = ov ? normalizeCard({ ...c, ...ov, vocab: ov.vocab || c.vocab }) : c;
          return mnemoMap[base.kanji] ? { ...base, mnemonic: mnemoMap[base.kanji] } : base;
        });

      const data = (await getSessionData(sessionId, 'kanji')) as SessionKanjiEntry[];
      if (Array.isArray(data) && data.length) {
        merged = [...merged, ...data.map(normalizeCard).filter((c) => c.kanji)];
      }
      setCards(merged);
      setIndex(0);
      setFlipped(false);
      setDone(new Set());
      setUnknown(new Set());
    } catch {
      setLoadError('Không tải được kanji từ cloud. Thử lại sau.');
      setCards(baseCards);
    } finally {
      setLoading(false);
    }
  }, [sessionId, baseCards]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Admin-only force manage
  useEffect(() => {
    if (!isAdmin || typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('force') === 'manage') {
      setManaging(true);
      setMode('viewall');
    }
  }, [isAdmin]);

  // Keyboard: flashcard mode only
  useEffect(() => {
    if (mode !== 'flashcard' || managing || loading || cards.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.code === 'ArrowLeft') {
        setFlipped(false);
        setEditingMnemonic(false);
        setIndex((i) => (i - 1 + cards.length) % cards.length);
      }
      if (e.code === 'ArrowRight') {
        setFlipped(false);
        setEditingMnemonic(false);
        setIndex((i) => (i + 1) % cards.length);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, managing, loading, cards.length]);

  useEffect(() => {
    if (mode === 'quiz') answerStartRef.current = Date.now();
  }, [qIdx, mode]);

  const baseLen = baseCards.length;
  const reviewed = useMemo(() => new Set([...done, ...unknown]), [done, unknown]);
  const remaining = cards.length - reviewed.size;
  const progressPct = cards.length ? Math.round((reviewed.size / cards.length) * 100) : 0;
  const knownPct = cards.length ? Math.round((done.size / cards.length) * 100) : 0;

  async function persistCloudSlice(allCards: SessionKanjiEntry[]) {
    const dbItems = allCards.slice(baseLen).map(normalizeCard);
    if (dbItems.length === 0) {
      // If no cloud items left, clear row
      await deleteAllSessionData(sessionId, 'kanji').catch(() => {});
      return;
    }
    await supabase
      .from('session_data')
      .upsert(
        {
          session_num: sessionId,
          type: 'kanji',
          items: dbItems,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_num,type' }
      );
  }

  function saveBaseOverride(card: SessionKanjiEntry) {
    const key = `kanji_card_override_${sessionId}`;
    const map = safeParseJson<Record<string, SessionKanjiEntry>>(localStorage.getItem(key), {});
    map[card.kanji] = card;
    localStorage.setItem(key, JSON.stringify(map));
  }

  async function saveMnemonic() {
    const card = cards[index];
    if (!card) return;
    const updated = [...cards];
    updated[index] = { ...card, mnemonic: mnemonicText };
    setCards(updated);
    setEditingMnemonic(false);

    if (index < baseLen) {
      const key = `kanji_mnemonic_${sessionId}`;
      const map = safeParseJson<Record<string, string>>(localStorage.getItem(key), {});
      map[card.kanji] = mnemonicText;
      localStorage.setItem(key, JSON.stringify(map));
      saveBaseOverride(updated[index]);
    } else {
      await persistCloudSlice(updated).catch(() => {});
    }
  }

  function startEdit(idx: number) {
    if (!isAdmin) return;
    setEditIdx(idx);
    setEditForm(normalizeCard({ ...cards[idx], vocab: [...(cards[idx].vocab || [])] }));
  }

  async function saveEdit() {
    if (!isAdmin || editIdx === null || !editForm) return;
    const updated = [...cards];
    updated[editIdx] = normalizeCard(editForm);
    setCards(updated);
    if (editIdx < baseLen) {
      saveBaseOverride(updated[editIdx]);
    } else {
      await persistCloudSlice(updated).catch(() => {});
    }
    setEditIdx(null);
    setEditForm(null);
  }

  async function handleDeleteKanji(idx: number) {
    if (!isAdmin) return;
    if (!confirm(`Xóa "${cards[idx].kanji}"?`)) return;
    if (idx >= baseLen) {
      await deleteSessionItem(sessionId, 'kanji', idx - baseLen).catch(() => {});
    } else {
      // Base card: mark deleted in localStorage exclusions
      const key = `kanji_deleted_base_${sessionId}`;
      const list = safeParseJson<string[]>(localStorage.getItem(key), []);
      if (!list.includes(cards[idx].kanji)) {
        list.push(cards[idx].kanji);
        localStorage.setItem(key, JSON.stringify(list));
      }
    }
    const next = cards.filter((_, i) => i !== idx);
    setCards(next);
    if (editIdx === idx) {
      setEditIdx(null);
      setEditForm(null);
    }
  }

  function markCard(known: boolean) {
    const card = cards[index];
    if (card?.kanji) {
      addKanjiToSRS(card.kanji);
      reviewKanji(card.kanji, known, 0);
    }
    const nd = new Set(done);
    const nu = new Set(unknown);
    if (known) {
      nd.add(index);
      nu.delete(index);
    } else {
      nu.add(index);
      nd.delete(index);
    }
    setDone(nd);
    setUnknown(nu);
    setFlipped(false);
    setEditingMnemonic(false);

    const all = new Set([...nd, ...nu]);
    if (all.size >= cards.length) return;
    let n = (index + 1) % cards.length;
    let guard = 0;
    while (all.has(n) && guard < cards.length) {
      n = (n + 1) % cards.length;
      guard++;
    }
    setIndex(n);
  }

  function startKanjiQuiz() {
    setQuizError('');
    const allVocab = cards.flatMap((c) =>
      (c.vocab || [])
        .filter((v) => v.word?.trim() && v.meaning?.trim())
        .map((v) => ({ ...v, kanji: c.kanji }))
    );
    if (allVocab.length === 0) {
      setQuizError('Không có từ vựng (vocab) để tạo câu hỏi. Thêm vocab cho kanji trước.');
      return;
    }
    if (cards.length < 2) {
      setQuizError('Cần ít nhất 2 kanji để tạo đáp án nhiễu.');
      return;
    }

    const shuffled = shuffle(allVocab);
    const questions: QuizQ[] = [];
    for (const v of shuffled) {
      const wrong = shuffle(cards.filter((c) => c.kanji !== v.kanji).map((c) => c.kanji)).slice(0, 3);
      if (wrong.length === 0) continue;
      const options = shuffle([v.kanji, ...wrong]);
      questions.push({
        question: v.meaning,
        reading: v.reading || '',
        word: v.word,
        correctKanji: v.kanji,
        options,
        meaning: v.meaning,
      });
    }
    if (questions.length === 0) {
      setQuizError('Không tạo được câu hỏi.');
      return;
    }
    questions.forEach((q) => addKanjiToSRS(q.correctKanji));
    setQuizQuestions(questions);
    setQIdx(0);
    setQSelected(null);
    setQScore(0);
    setShowQuizExplain(false);
    setMode('quiz');
  }

  function handleQuizSelect(i: number) {
    if (qSelected !== null) return;
    setQSelected(i);
    const q = quizQuestions[qIdx];
    const correct = q.options[i] === q.correctKanji;
    if (correct) setQScore((s) => s + 1);
    reviewKanji(q.correctKanji, correct, Date.now() - answerStartRef.current);
    setShowQuizExplain(true);
  }

  function quizNext() {
    setQSelected(null);
    setShowQuizExplain(false);
    setQIdx((idx) => idx + 1);
  }

  function openManage() {
    if (!isAdmin) return;
    setManaging(true);
  }

  // ——— LOADING ———
  if (loading) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-400">Đang tải kanji buổi {sessionId}…</p>
      </div>
    );
  }

  // ——— EMPTY ———
  if (!cards.length) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <div className="self-start mb-4">
          <BackLink sessionId={sessionId} />
        </div>
        <p className="text-4xl mb-4">📭</p>
        <p className="text-lg font-bold text-gray-800">Buổi {sessionId} chưa có Kanji</p>
        <p className="text-sm text-gray-500 mt-2">Thêm dữ liệu Kanji để bắt đầu học</p>
        {loadError && <p className="text-xs text-amber-600 mt-2">{loadError}</p>}
        {isAdmin && (
          <a
            href={`/upload?session=${sessionId}`}
            className="mt-4 px-6 py-3 text-white rounded-xl font-medium shadow"
            style={{ background: '#6C63FF' }}
          >
            ➕ Thêm Kanji
          </a>
        )}
      </div>
    );
  }

  // ——— MANAGE (admin only) ———
  if (managing && isAdmin) {
    function exportKanji() {
      const json = JSON.stringify(cards, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kanji-buoi-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">🗑️ Quản lý Kanji ({cards.length})</h1>
          <button
            type="button"
            onClick={() => {
              setManaging(false);
              setEditJson(false);
              setEditIdx(null);
            }}
            className="text-sm text-gray-500"
          >
            ← Quay lại
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={exportKanji}
            className="px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl text-sm font-medium shadow"
          >
            📤 Export JSON
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`Xóa tất cả kanji cloud buổi ${sessionId}? (Base local vẫn giữ nếu có)`)) return;
              await deleteAllSessionData(sessionId, 'kanji').catch(() => {});
              // Reload: base + no cloud
              const mnemoKey = `kanji_mnemonic_${sessionId}`;
              const mnemoMap = safeParseJson<Record<string, string>>(localStorage.getItem(mnemoKey), {});
              const kept = baseCards.map((c) =>
                mnemoMap[c.kanji] ? { ...c, mnemonic: mnemoMap[c.kanji] } : c
              );
              setCards(kept);
              setManaging(false);
            }}
            className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl text-sm font-medium shadow"
          >
            🗑️ Xóa cloud
          </button>
          <a
            href={`/upload?session=${sessionId}`}
            className="inline-block px-4 py-2 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl text-sm font-medium shadow"
          >
            ➕ Thêm Kanji
          </a>
          <button
            type="button"
            onClick={() => {
              setEditJson(!editJson);
              if (!editJson) {
                setEditJsonText(JSON.stringify(cards, null, 2));
                setEditJsonError('');
              }
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium shadow ${editJson ? 'bg-indigo-500 text-white' : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'}`}
          >
            📝 Edit JSON
          </button>
        </div>
        {editJson && (
          <div className="mb-4 space-y-2">
            <textarea
              value={editJsonText}
              onChange={(e) => setEditJsonText(e.target.value)}
              className="w-full h-64 p-3 font-mono text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
              spellCheck={false}
            />
            {editJsonError && <p className="text-red-500 text-xs">⚠ {editJsonError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const parsed = JSON.parse(editJsonText);
                    if (!Array.isArray(parsed)) throw new Error('Phải là một mảng');
                    const normalized = parsed.map(normalizeCard);
                    setCards(normalized);
                    // Persist: first baseLen stay as base overrides where needed; rest to cloud
                    const dbItems = normalized.slice(baseLen);
                    if (dbItems.length) {
                      await supabase.from('session_data').upsert(
                        {
                          session_num: sessionId,
                          type: 'kanji',
                          items: dbItems,
                          updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'session_num,type' }
                      );
                    } else {
                      await deleteAllSessionData(sessionId, 'kanji').catch(() => {});
                    }
                    setEditJson(false);
                  } catch (e: unknown) {
                    setEditJsonError(e instanceof Error ? e.message : 'JSON không hợp lệ');
                  }
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium shadow hover:bg-emerald-600"
              >
                💾 Lưu
              </button>
              <button
                type="button"
                onClick={() => setEditJson(false)}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {cards.map((c, i) => {
            if (editIdx === i && editForm) {
              return (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Kanji</label>
                      <input
                        value={editForm.kanji}
                        onChange={(e) => setEditForm({ ...editForm, kanji: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Hán Việt</label>
                      <input
                        value={editForm.hanViet}
                        onChange={(e) => setEditForm({ ...editForm, hanViet: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Nghĩa</label>
                    <input
                      value={editForm.meaning}
                      onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Âm On</label>
                      <input
                        value={editForm.onyomi || ''}
                        onChange={(e) => setEditForm({ ...editForm, onyomi: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Âm Kun</label>
                      <input
                        value={editForm.kunyomi || ''}
                        onChange={(e) => setEditForm({ ...editForm, kunyomi: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Ghi nhớ</label>
                    <textarea
                      value={editForm.mnemonic || ''}
                      onChange={(e) => setEditForm({ ...editForm, mnemonic: e.target.value })}
                      className="w-full h-16 p-2 border rounded-lg text-xs resize-y"
                      placeholder="VD: Tay (扌) cầm vũ khí (殳) **ném**"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                        Từ vựng ({editForm.vocab.length})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            vocab: [
                              ...editForm.vocab,
                              { word: '', reading: '', meaning: '', highlight: '' },
                            ],
                          })
                        }
                        className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded"
                      >
                        + Thêm
                      </button>
                    </div>
                    {editForm.vocab.map((v, vi) => (
                      <div key={vi} className="mb-2 p-2 bg-gray-50 rounded-lg space-y-1.5 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              vocab: editForm.vocab.filter((_, j) => j !== vi),
                            })
                          }
                          className="absolute top-1 right-1 text-[10px] text-red-400 hover:text-red-600"
                          aria-label="Xóa từ vựng"
                        >
                          ✕
                        </button>
                        <div className="flex gap-1.5">
                          <input
                            value={v.word}
                            onChange={(e) => {
                              const v2 = [...editForm.vocab];
                              v2[vi] = { ...v2[vi], word: e.target.value };
                              setEditForm({ ...editForm, vocab: v2 });
                            }}
                            placeholder="Từ"
                            className="flex-1 px-2 py-1 border rounded text-xs"
                          />
                          <input
                            value={v.reading}
                            onChange={(e) => {
                              const v2 = [...editForm.vocab];
                              v2[vi] = { ...v2[vi], reading: e.target.value };
                              setEditForm({ ...editForm, vocab: v2 });
                            }}
                            placeholder="Đọc"
                            className="flex-1 px-2 py-1 border rounded text-xs"
                          />
                          <input
                            value={v.meaning}
                            onChange={(e) => {
                              const v2 = [...editForm.vocab];
                              v2[vi] = { ...v2[vi], meaning: e.target.value };
                              setEditForm({ ...editForm, vocab: v2 });
                            }}
                            placeholder="Nghĩa"
                            className="flex-1 px-2 py-1 border rounded text-xs"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            value={v.highlight || ''}
                            onChange={(e) => {
                              const v2 = [...editForm.vocab];
                              v2[vi] = { ...v2[vi], highlight: e.target.value };
                              setEditForm({ ...editForm, vocab: v2 });
                            }}
                            placeholder="Highlight"
                            className="flex-1 px-2 py-1 border rounded text-xs"
                          />
                          <input
                            value={v.highlightReading || ''}
                            onChange={(e) => {
                              const v2 = [...editForm.vocab];
                              v2[vi] = { ...v2[vi], highlightReading: e.target.value };
                              setEditForm({ ...editForm, vocab: v2 });
                            }}
                            placeholder="Highlight đọc"
                            className="flex-1 px-2 py-1 border rounded text-xs"
                          />
                          <input
                            value={v.highlightMeaning || ''}
                            onChange={(e) => {
                              const v2 = [...editForm.vocab];
                              v2[vi] = { ...v2[vi], highlightMeaning: e.target.value };
                              setEditForm({ ...editForm, vocab: v2 });
                            }}
                            placeholder="Highlight nghĩa"
                            className="flex-1 px-2 py-1 border rounded text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={saveEdit} className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg">
                      💾 Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIdx(null)}
                      className="text-xs px-3 py-1.5 bg-gray-200 rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={`${c.kanji}-${i}`}
                className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100"
              >
                <div>
                  <span className="text-2xl md:text-3xl font-bold">{c.kanji}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {c.hanViet} — {c.meaning}
                  </span>
                  {i < baseLen && <span className="ml-2 text-[10px] text-gray-300">base</span>}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="text-xs px-2 py-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    aria-label={`Sửa ${c.kanji}`}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteKanji(i)}
                    className="text-xs px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    aria-label={`Xóa ${c.kanji}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ——— VIEW ALL ———
  if (mode === 'viewall') {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">📋 Tất cả Kanji ({cards.length})</h1>
          <button type="button" onClick={() => setMode('flashcard')} className="text-sm text-gray-500">
            ← Quay lại
          </button>
        </div>
        <div className="space-y-3">
          {cards.map((c, i) => (
            <div key={`${c.kanji}-${i}`} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative">
              <span className="absolute top-2 right-3 text-[11px] text-gray-300 font-medium">{i + 1}</span>
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => speak(c.onyomi || c.kunyomi || c.kanji)}
                  className="text-4xl md:text-5xl font-bold shrink-0"
                  style={{ color: '#6C63FF' }}
                  aria-label="Nghe"
                >
                  {c.kanji}
                </button>
                <div className="flex-1 pt-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-bold text-amber-500">{c.hanViet}</span>
                    <span className="text-sm text-gray-600">{c.meaning}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.onyomi && <span className="mr-2">音: {toHiragana(c.onyomi)}</span>}
                    {c.kunyomi && <span>訓: {c.kunyomi}</span>}
                  </div>
                  {c.mnemonic && (
                    <p className="text-xs text-gray-500 mt-1">💡 {highlightMnemonic(c.mnemonic)}</p>
                  )}
                </div>
              </div>
              {c.vocab.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {c.vocab.map((v, j) => (
                    <div key={j} className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="text-sm sm:text-xl font-bold text-gray-800">
                        {highlightText(v.word, v.highlight || c.kanji)}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {highlightReading(v.reading, v.highlightReading, c.onyomi, c.kunyomi)}
                      </div>
                      <div className="text-xs text-gray-600">{highlightText(v.meaning, v.highlightMeaning)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ——— QUIZ ———
  if (mode === 'quiz') {
    if (quizQuestions.length === 0) {
      return (
        <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 mb-4">{quizError || 'Không có câu hỏi'}</p>
          <button type="button" onClick={() => setMode('flashcard')} className="px-5 py-2 bg-gray-200 rounded-xl">
            Quay lại
          </button>
        </div>
      );
    }

    if (qIdx >= quizQuestions.length) {
      const pct = Math.round((qScore / quizQuestions.length) * 100);
      return (
        <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-xl font-bold text-gray-800">Kết quả trắc nghiệm Kanji</p>
          <p className="text-3xl font-bold text-indigo-600 mt-3">
            {qScore}/{quizQuestions.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">{pct}% đúng</p>
          <p className="text-xs text-gray-400 mt-2">Đã cập nhật SRS Kanji</p>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={startKanjiQuiz}
              className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow"
            >
              Làm lại
            </button>
            <button type="button" onClick={() => setMode('flashcard')} className="px-5 py-2 bg-gray-200 rounded-xl font-medium">
              Quay lại
            </button>
          </div>
        </div>
      );
    }

    const q = quizQuestions[qIdx];
    const isCorrect = qSelected !== null && q.options[qSelected] === q.correctKanji;

    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
        <div className="w-full max-w-md mb-2">
          <button type="button" onClick={() => setMode('flashcard')} className="text-sm text-gray-500 hover:text-indigo-500">
            ← Thoát quiz
          </button>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">✍️ Trắc nghiệm Kanji</h1>
        <p className="text-sm text-gray-500 mb-6">
          Câu {qIdx + 1}/{quizQuestions.length} • Đúng: {qScore}
        </p>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-6 w-full max-w-md">
          {q.reading && <p className="text-sm text-gray-400 mb-1">{q.reading}</p>}
          <p className="text-lg font-bold text-gray-800">{q.question}</p>
          {q.word && <p className="text-xs text-gray-400 mt-2">Từ: {q.word}</p>}
        </div>
        <p className="text-sm text-gray-500 mb-4">Chọn Kanji đúng:</p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {q.options.map((opt, i) => {
            let cls = 'bg-white border-2 border-gray-200 hover:border-indigo-300';
            if (qSelected !== null) {
              if (opt === q.correctKanji) cls = 'bg-emerald-100 border-2 border-emerald-400';
              else if (i === qSelected) cls = 'bg-red-100 border-2 border-red-400';
            }
            return (
              <button
                key={i}
                type="button"
                disabled={qSelected !== null}
                onClick={() => handleQuizSelect(i)}
                className={`${cls} py-5 rounded-xl text-3xl md:text-4xl font-bold transition-all shadow-sm`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {showQuizExplain && (
          <div
            className={`mt-4 w-full max-w-sm rounded-xl p-4 border ${
              isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <p className={`text-sm font-bold mb-1 ${isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
              {isCorrect ? '✅ Chính xác' : '✗ Sai'}
            </p>
            <p className="text-lg font-bold text-gray-800">
              {q.correctKanji}{' '}
              <span className="text-sm font-normal text-gray-500">
                {q.word}（{q.reading}）
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{q.meaning}</p>
            <button
              type="button"
              onClick={() => speak(q.reading || q.word)}
              className="mt-2 text-sm text-gray-500 hover:text-indigo-500"
            >
              🔊 Nghe
            </button>
            <button
              type="button"
              onClick={quizNext}
              className="mt-3 w-full py-2.5 text-white rounded-lg text-sm font-medium"
              style={{ background: '#6C63FF' }}
            >
              {qIdx + 1 >= quizQuestions.length ? 'Xem kết quả' : 'Tiếp →'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ——— SUMMARY ———
  if (remaining === 0 && cards.length > 0) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <div className="self-start w-full max-w-md mx-auto mb-4">
          <BackLink sessionId={sessionId} />
        </div>
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-xl font-bold text-gray-800">Tổng kết Kanji Buổi {sessionId}</p>
        <p className="text-emerald-600 mt-2">
          ✅ Thuộc: {done.size} | ❌ Chưa: {unknown.size}
        </p>
        {quizError && <p className="text-xs text-amber-600 mt-2">{quizError}</p>}
        <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
          <button
            type="button"
            onClick={startKanjiQuiz}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow"
          >
            ✍️ Trắc nghiệm từ ví dụ
          </button>
          {unknown.size > 0 && (
            <button
              type="button"
              onClick={() => {
                // Re-study only unknown: reorder so unknown first, reset progress
                const unk = [...unknown];
                const rest = cards.map((_, i) => i).filter((i) => !unknown.has(i));
                const order = [...unk, ...rest];
                setCards(order.map((i) => cards[i]));
                setDone(new Set());
                setUnknown(new Set());
                setIndex(0);
                setFlipped(false);
                setIsShuffled(false);
              }}
              className="w-full py-3 bg-red-500 text-white rounded-xl font-medium shadow"
            >
              🔄 Chỉ ôn {unknown.size} thẻ chưa thuộc
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setDone(new Set());
              setUnknown(new Set());
              setIndex(0);
              setFlipped(false);
            }}
            className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium shadow"
          >
            🔄 Học lại tất cả
          </button>
        </div>
        {unknown.size > 0 && (
          <div className="mt-6 w-full max-w-md text-left">
            <p className="font-bold text-red-500 mb-2">Cần ôn lại:</p>
            {[...unknown].map((i) => (
              <div key={i} className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100">
                <span className="text-2xl md:text-3xl font-bold">{cards[i].kanji}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {cards[i].hanViet} — {cards[i].meaning}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ——— FLASHCARD ———
  const card = cards[index];
  if (!card) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center text-gray-500">
        <BackLink sessionId={sessionId} />
      </div>
    );
  }

  const toolBtn =
    'shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-indigo-600 transition-colors';

  return (
    <div className="min-h-[calc(100dvh-5rem)] pb-24 pt-2 px-2 sm:px-4 flex flex-col items-center w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">
      <div className="w-full mb-2">
        <BackLink sessionId={sessionId} />
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 text-center">
        🈁 Kanji Buổi {sessionId}
        <span className="text-sm sm:text-base font-normal text-gray-400 ml-2">
          {index + 1}/{cards.length}
        </span>
      </h1>
      {loadError && <p className="text-[11px] text-amber-600 mb-1 w-full text-center">{loadError}</p>}
      {quizError && <p className="text-[11px] text-amber-600 mb-1 w-full text-center">{quizError}</p>}

      {/* Progress */}
      <div className="w-full mb-2">
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-1.5">
          <span className="shrink-0">
            Còn {remaining}/{cards.length}
          </span>
          <span className="shrink-0 text-gray-400">Đã xem {progressPct}%</span>
        </div>
        <div className="h-2.5 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.max(progressPct, progressPct > 0 ? 4 : 0)}%`, background: '#6C63FF' }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2 mb-4">
        {isShuffled && (
          <span className="text-xs px-2.5 py-1.5 rounded-full font-medium text-white shrink-0" style={{ background: '#6C63FF' }}>
            🔀 Đang trộn
          </span>
        )}
        <button type="button" onClick={() => setMode('viewall')} className={toolBtn} title="Xem tất cả">
          📋 Tất cả
        </button>
        <button
          type="button"
          onClick={() => {
            setCards(shuffle(cards));
            setIndex(0);
            setFlipped(false);
            setDone(new Set());
            setUnknown(new Set());
            setIsShuffled(true);
            setEditingMnemonic(false);
          }}
          className={`${toolBtn} ${isShuffled ? 'text-indigo-600 bg-indigo-50' : ''}`}
          title="Trộn thứ tự thẻ"
        >
          🔀 Trộn
        </button>
        <button type="button" onClick={startKanjiQuiz} className={toolBtn} title="Trắc nghiệm">
          ✍️ Quiz
        </button>
        {isAdmin && (
          <button type="button" onClick={openManage} className={`${toolBtn} hover:text-red-600`} title="Quản lý">
            🗑️ Quản lý
          </button>
        )}
      </div>

      {/* Card — large on desktop like before */}
      <div
        className="w-full relative mb-4"
        style={{
          perspective: '1400px',
          /* mobile ~48vh, desktop up to ~62vh / 560px */
          minHeight: 'min(62vh, 560px)',
          height: 'min(62vh, 560px)',
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl sm:rounded-3xl"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.35s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front — kanji only */}
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFlipped((f) => !f);
              }
            }}
            className="absolute inset-0 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 cursor-pointer select-none"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg) translateZ(1px)',
              background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)',
            }}
            onClick={() => setFlipped((f) => !f)}
          >
            <span className="text-8xl sm:text-9xl md:text-[10rem] font-bold text-white leading-none tracking-wide">
              {card.kanji || '？'}
            </span>
            <p className="text-sm sm:text-base text-white/50">Chạm để lật</p>
          </div>

          {/* Back */}
          <div
            role="button"
            tabIndex={0}
            className="absolute inset-0 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 md:p-8 overflow-y-auto cursor-pointer select-none"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(1px)',
              background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)',
            }}
            onClick={() => !editingMnemonic && setFlipped((f) => !f)}
          >
            <div className="flex flex-col items-center relative w-full min-h-full pb-2">
              <span className="text-6xl sm:text-7xl md:text-8xl font-bold text-white leading-none">
                {card.kanji || '？'}
              </span>
              <span className="text-lg sm:text-xl md:text-2xl mt-2 font-semibold text-center">
                <span className="text-white">{card.hanViet}</span>{' '}
                <span className="text-amber-300">— {card.meaning}</span>
              </span>
              <div className="text-center text-white/80 text-sm sm:text-base mt-2 flex items-center gap-2 flex-wrap justify-center">
                {card.onyomi && <span>音: {toHiragana(card.onyomi)}</span>}
                {card.kunyomi && <span>訓: {card.kunyomi}</span>}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(toHiragana(card.onyomi || '') || card.kunyomi || card.kanji);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg"
                  aria-label="Nghe"
                >
                  🔊
                </button>
              </div>
              {card.mnemonic && (
                <div className="mt-3 rounded-xl p-3 sm:p-4 w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-sm sm:text-base text-white">💡 {highlightMnemonic(card.mnemonic, true)}</p>
                </div>
              )}
              {!editingMnemonic && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMnemonicText(card.mnemonic || '');
                    setEditingMnemonic(true);
                  }}
                  className="absolute top-0 right-0 cursor-pointer text-sm text-white/40 hover:text-white p-1"
                  aria-label="Sửa ghi nhớ"
                >
                  ✏️
                </button>
              )}
              {editingMnemonic && (
                <div className="mt-2 w-full" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={mnemonicText}
                    onChange={(e) => setMnemonicText(e.target.value)}
                    placeholder="VD: Tay (扌) cầm vũ khí (殳) **ném**"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={saveMnemonic} className="text-xs px-3 py-1 bg-emerald-400 text-white rounded-lg">
                      💾 Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMnemonic(false)}
                      className="text-xs px-3 py-1 bg-white/20 text-white rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-3 w-full space-y-2">
                {card.vocab.map((v, i) => (
                  <div key={i} className="rounded-xl p-3 sm:p-3.5 relative" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <span className="absolute top-2 right-3 text-[10px] text-white/25">{i + 1}</span>
                    <div className="min-w-0 pr-5">
                      <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                        <span>{highlightText(v.word, v.highlight || card.kanji)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(v.reading || v.word);
                          }}
                          className="text-white/40 hover:text-white text-sm shrink-0"
                          aria-label="Nghe từ"
                        >
                          🔊
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm text-white/45 mt-0.5">
                        {highlightReading(v.reading, v.highlightReading, card.onyomi, card.kunyomi)}
                      </div>
                      <div className="text-sm text-white/75 mt-0.5">
                        {highlightText(v.meaning, v.highlightMeaning)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions — larger on desktop */}
      <div className="flex items-center gap-2 sm:gap-3 w-full justify-center flex-wrap mb-3">
        <button
          type="button"
          onClick={() => {
            setIndex((index - 1 + cards.length) % cards.length);
            setFlipped(false);
            setEditingMnemonic(false);
          }}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gray-200 text-gray-700 text-sm sm:text-base font-medium shrink-0"
          aria-label="Thẻ trước"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => markCard(false)}
          className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-red-500/90 text-white text-sm sm:text-base font-medium shadow shrink-0"
        >
          Chưa thuộc
        </button>
        <button
          type="button"
          onClick={() => markCard(true)}
          className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-white text-sm sm:text-base font-medium shadow shrink-0"
          style={{ background: '#22C55E' }}
        >
          Đã thuộc ✓
        </button>
        <button
          type="button"
          onClick={() => {
            setIndex((index + 1) % cards.length);
            setFlipped(false);
            setEditingMnemonic(false);
          }}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gray-200 text-gray-700 text-sm sm:text-base font-medium shrink-0"
          aria-label="Thẻ sau"
        >
          ▶
        </button>
      </div>

      <div className="w-full mt-1">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Đã xem {reviewed.size}</span>
          <span>Thuộc {knownPct}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${knownPct}%`, background: '#22C55E' }} />
        </div>
      </div>
    </div>
  );
}
