'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { speak } from '@/lib/speak';
import { sessionKanji, SessionKanjiEntry } from '@/data/session-kanji';
import { getSessionData, deleteSessionItem } from '@/lib/session-data';
import { supabase } from '@/lib/supabase';

function toHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function SessionKanjiPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const sessionId = parseInt(id as string);
  const baseCards = sessionKanji[sessionId] || [];
  const [cards, setCards] = useState<SessionKanjiEntry[]>(baseCards);

  useEffect(() => {
    // Load mnemonics from localStorage for base cards
    const key = `kanji_mnemonic_${sessionId}`;
    const raw = localStorage.getItem(key);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    const merged = baseCards.map(c => map[c.kanji] ? { ...c, mnemonic: map[c.kanji] } : c);

    getSessionData(sessionId, 'kanji').then(data => {
      const all = (data as SessionKanjiEntry[]).length ? [...merged, ...(data as SessionKanjiEntry[])] : merged;
      setCards(all);
    });
  }, [sessionId]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<'flashcard' | 'quiz' | 'viewall'>('flashcard');

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<{ question: string; reading: string; correctKanji: string; options: string[] }[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [qSelected, setQSelected] = useState<number | null>(null);
  const [qScore, setQScore] = useState(0);

  // Spacebar + Arrow shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f); }
      if (e.code === 'ArrowLeft') { setFlipped(false); setIndex((i) => (i - 1 + cards.length) % cards.length); }
      if (e.code === 'ArrowRight') { setFlipped(false); setIndex((i) => (i + 1) % cards.length); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cards.length]);

  const reviewed = new Set([...done, ...unknown]);
  const remaining = cards.length - reviewed.size;

  function next(known: boolean) {
    const nd = new Set(done), nu = new Set(unknown);
    if (known) nd.add(index); else nu.add(index);
    setDone(nd); setUnknown(nu);
    setFlipped(false);
    setTimeout(() => {
      const all = new Set([...nd, ...nu]);
      if (all.size >= cards.length) return;
      let n = (index + 1) % cards.length;
      while (all.has(n)) n = (n + 1) % cards.length;
      setIndex(n);
    }, 300);
  }

  const [isShuffled, setIsShuffled] = useState(false);
  const [managing, setManaging] = useState(false);
  const [editJson, setEditJson] = useState(false);
  const [editJsonText, setEditJsonText] = useState('');
  const [editJsonError, setEditJsonError] = useState('');
  const [editingMnemonic, setEditingMnemonic] = useState(false);
  const [mnemonicText, setMnemonicText] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SessionKanjiEntry | null>(null);

  async function saveMnemonic() {
    const updated = [...cards];
    updated[index] = { ...updated[index], mnemonic: mnemonicText };
    setCards(updated);
    setEditingMnemonic(false);
    // Save to DB: update the uploaded items
    const baseLen = baseCards.length;
    if (index < baseLen) {
      // Hardcoded card — save mnemonic to localStorage fallback
      const key = `kanji_mnemonic_${sessionId}`;
      const raw = localStorage.getItem(key);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      map[cards[index].kanji] = mnemonicText;
      localStorage.setItem(key, JSON.stringify(map));
    } else {
      // DB card — update in supabase
      const dbItems = updated.slice(baseLen);
      await supabase.from('session_data').update({ items: dbItems, updated_at: new Date().toISOString() }).eq('session_num', sessionId).eq('type', 'kanji');
    }
  }

  function startEdit(idx: number) {
    setEditIdx(idx);
    setEditForm({ ...cards[idx] });
  }

  async function saveEdit() {
    if (editIdx === null || !editForm) return;
    const updated = [...cards];
    updated[editIdx] = editForm;
    setCards(updated);
    const baseLen = baseCards.length;
    const dbItems = updated.slice(baseLen);
    if (dbItems.length) await supabase.from('session_data').update({ items: dbItems, updated_at: new Date().toISOString() }).eq('session_num', sessionId).eq('type', 'kanji');
    setEditIdx(null);
    setEditForm(null);
  }

  async function handleDeleteKanji(idx: number) {
    if (!confirm(`Xóa "${cards[idx].kanji}"?`)) return;
    const baseLen = baseCards.length;
    if (idx >= baseLen) {
      await deleteSessionItem(sessionId, 'kanji', idx - baseLen);
    }
    setCards(cards.filter((_, i) => i !== idx));
  }

  if (!cards.length) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <Link href="/schedule" className="self-start text-sm text-gray-500 hover:text-indigo-500 transition-colors flex items-center gap-1 mb-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Quay lại
        </Link>
        <p className="text-4xl mb-4">📭</p>
        <p className="text-lg font-bold text-gray-800">Buổi {sessionId} chưa có Kanji</p>
        <p className="text-sm text-gray-500 mt-2">Thêm dữ liệu Kanji để bắt đầu học</p>
        {isAdmin && <a href={`/upload?session=${sessionId}`} className="mt-4 px-6 py-3 text-white rounded-xl font-medium shadow" style={{ background: '#6C63FF' }}>➕ Thêm Kanji</a>}
      </div>
    );
  }

  // === MANAGE (delete) ===
  if (managing) {
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
          <button onClick={() => setManaging(false)} className="text-sm text-gray-500">← Quay lại</button>
        </div>
        <button onClick={exportKanji} className="mb-4 px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl text-sm font-medium shadow">📤 Export JSON</button>
        <button onClick={async () => { if (!confirm(`Xóa tất cả ${cards.length} kanji buổi ${sessionId}?`)) return; await supabase.from('session_data').delete().eq('session_num', sessionId).eq('type', 'kanji'); setCards([]); setManaging(false); }} className="mb-4 ml-2 px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl text-sm font-medium shadow">🗑️ Xóa tất cả</button>
        {isAdmin && <a href={`/upload?session=${sessionId}`} className="mb-4 ml-2 inline-block px-4 py-2 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl text-sm font-medium shadow">➕ Thêm Kanji</a>}
        <button onClick={() => { setEditJson(!editJson); if (!editJson) { setEditJsonText(JSON.stringify(cards, null, 2)); setEditJsonError(''); } }} className={`mb-4 ml-2 px-4 py-2 rounded-xl text-sm font-medium shadow ${editJson ? 'bg-indigo-500 text-white' : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'}`}>📝 Edit JSON</button>
        {editJson && (
          <div className="mb-4 space-y-2">
            <textarea value={editJsonText} onChange={(e) => setEditJsonText(e.target.value)} className="w-full h-64 p-3 font-mono text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y" spellCheck={false} />
            {editJsonError && <p className="text-red-500 text-xs">⚠ {editJsonError}</p>}
            <div className="flex gap-2">
              <button onClick={async () => { try { const parsed = JSON.parse(editJsonText); if (!Array.isArray(parsed)) throw new Error('Phải là một mảng'); setCards(parsed); const baseLen = baseCards.length; const dbItems = parsed.slice(baseLen); if (dbItems.length) await supabase.from('session_data').update({ items: dbItems, updated_at: new Date().toISOString() }).eq('session_num', sessionId).eq('type', 'kanji'); setEditJson(false); } catch (e: unknown) { setEditJsonError(e instanceof Error ? e.message : 'JSON không hợp lệ'); } }} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium shadow hover:bg-emerald-600">💾 Lưu</button>
              <button onClick={() => setEditJson(false)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium">Hủy</button>
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
                      <input value={editForm.kanji} onChange={(e) => setEditForm({ ...editForm, kanji: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Hán Việt</label>
                      <input value={editForm.hanViet} onChange={(e) => setEditForm({ ...editForm, hanViet: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Nghĩa</label>
                    <input value={editForm.meaning} onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Âm On</label>
                      <input value={editForm.onyomi || ''} onChange={(e) => setEditForm({ ...editForm, onyomi: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Âm Kun</label>
                      <input value={editForm.kunyomi || ''} onChange={(e) => setEditForm({ ...editForm, kunyomi: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Ghi nhớ (mnemonic)</label>
                    <textarea value={editForm.mnemonic || ''} onChange={(e) => setEditForm({ ...editForm, mnemonic: e.target.value })} className="w-full h-16 p-2 border rounded-lg text-xs resize-y" placeholder="VD: Tay (扌) cầm vũ khí (殳) **ném**" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Từ vựng ({editForm.vocab.length})</label>
                      <button onClick={() => setEditForm({ ...editForm, vocab: [...editForm.vocab, { word: '', reading: '', meaning: '', highlight: '' }] })} className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded">+ Thêm</button>
                    </div>
                    {editForm.vocab.map((v, vi) => (
                      <div key={vi} className="mb-2 p-2 bg-gray-50 rounded-lg space-y-1.5 relative">
                        <button onClick={() => setEditForm({ ...editForm, vocab: editForm.vocab.filter((_, j) => j !== vi) })} className="absolute top-1 right-1 text-[10px] text-red-400 hover:text-red-600" aria-label="Xóa từ vựng">✕</button>
                        <div className="flex gap-1.5">
                          <input value={v.word} onChange={(e) => { const v2 = [...editForm.vocab]; v2[vi] = { ...v2[vi], word: e.target.value }; setEditForm({ ...editForm, vocab: v2 }); }} placeholder="Từ" className="flex-1 px-2 py-1 border rounded text-xs" />
                          <input value={v.reading} onChange={(e) => { const v2 = [...editForm.vocab]; v2[vi] = { ...v2[vi], reading: e.target.value }; setEditForm({ ...editForm, vocab: v2 }); }} placeholder="Đọc" className="flex-1 px-2 py-1 border rounded text-xs" />
                          <input value={v.meaning} onChange={(e) => { const v2 = [...editForm.vocab]; v2[vi] = { ...v2[vi], meaning: e.target.value }; setEditForm({ ...editForm, vocab: v2 }); }} placeholder="Nghĩa" className="flex-1 px-2 py-1 border rounded text-xs" />
                        </div>
                        <div className="flex gap-1.5">
                          <input value={v.highlight || ''} onChange={(e) => { const v2 = [...editForm.vocab]; v2[vi] = { ...v2[vi], highlight: e.target.value }; setEditForm({ ...editForm, vocab: v2 }); }} placeholder="Highlight (vd: 食)" className="flex-1 px-2 py-1 border rounded text-xs" />
                          <input value={v.highlightReading || ''} onChange={(e) => { const v2 = [...editForm.vocab]; v2[vi] = { ...v2[vi], highlightReading: e.target.value }; setEditForm({ ...editForm, vocab: v2 }); }} placeholder="Highlight đọc" className="flex-1 px-2 py-1 border rounded text-xs" />
                          <input value={v.highlightMeaning || ''} onChange={(e) => { const v2 = [...editForm.vocab]; v2[vi] = { ...v2[vi], highlightMeaning: e.target.value }; setEditForm({ ...editForm, vocab: v2 }); }} placeholder="Highlight nghĩa" className="flex-1 px-2 py-1 border rounded text-xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg">💾 Lưu</button>
                    <button onClick={() => setEditIdx(null)} className="text-xs px-3 py-1.5 bg-gray-200 rounded-lg">Hủy</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div>
                  <span className="text-2xl font-bold">{c.kanji}</span>
                  <span className="text-sm text-gray-500 ml-2">{c.hanViet} — {c.meaning}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(i)} className="text-xs px-2 py-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" aria-label={`Sửa ${c.kanji}`}>✏️</button>
                  <button onClick={() => handleDeleteKanji(i)} className="text-xs px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" aria-label={`Xóa ${c.kanji}`}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function startKanjiQuiz() {
    // Collect all vocab examples, shuffle, create questions
    const allVocab = cards.flatMap((c) => c.vocab.map((v) => ({ ...v, kanji: c.kanji })));
    const shuffled = [...allVocab].sort(() => Math.random() - 0.5);
    const questions = shuffled.map((v) => {
      const wrongKanji = cards.filter((c) => c.kanji !== v.kanji).sort(() => Math.random() - 0.5).slice(0, 3).map((c) => c.kanji);
      const opts = [v.kanji, ...wrongKanji].sort(() => Math.random() - 0.5);
      return { question: v.meaning, reading: v.reading, correctKanji: v.kanji, options: opts };
    });
    setQuizQuestions(questions);
    setQIdx(0); setQSelected(null); setQScore(0);
    setMode('quiz');
  }

  // === VIEW ALL ===
  if (mode === 'viewall') {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">📋 Tất cả Kanji ({cards.length})</h1>
          <button onClick={() => setMode('flashcard')} className="text-sm text-gray-500">← Quay lại</button>
        </div>
        <div className="space-y-3">
          {cards.map((c, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative">
              <span className="absolute top-2 right-3 text-[11px] text-gray-300 font-medium">{i + 1}</span>
              <div className="flex items-start gap-3">
                <span className="text-4xl font-bold" style={{ color: '#6C63FF' }}>{c.kanji}</span>
                <div className="flex-1 pt-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-bold text-amber-500">{c.hanViet}</span>
                    <span className="text-sm text-gray-600">{c.meaning}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.onyomi && <span className="mr-2">音: {c.onyomi}</span>}
                    {c.kunyomi && <span>訓: {c.kunyomi}</span>}
                  </div>
                  {c.mnemonic && <p className="text-xs text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: '💡 ' + c.mnemonic.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-amber-600">$1</span>') }} />}
                </div>
              </div>
              {c.vocab.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {c.vocab.map((v, j) => (
                    <div key={j} className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="text-sm font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: v.word.replace(new RegExp(`(${escapeRegex(v.highlight || c.kanji)})`, 'g'), '<span class="text-amber-500">$1</span>') }} />
                      <div className="text-xs text-gray-400 mt-0.5">{(() => { const hl = v.highlightReading || toHiragana(c.onyomi || '') || toHiragana(c.kunyomi || ''); if (!hl) return v.reading; const parts = v.reading.split(new RegExp(`(${escapeRegex(hl)})`, 'g')); return parts.map((p, j) => p.toLowerCase() === hl.toLowerCase() ? <span key={j} className="text-amber-500 font-medium">{p}</span> : p); })()}</div>
                      <div className="text-xs text-gray-600">{(() => { if (!v.highlightMeaning) return v.meaning; const parts = v.meaning.split(new RegExp(`(${escapeRegex(v.highlightMeaning)})`, 'gi')); return parts.map((p, j) => p.toLowerCase() === v.highlightMeaning!.toLowerCase() ? <span key={j} className="text-amber-500 font-medium">{p}</span> : p); })()}</div>
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

  // === QUIZ MODE ===
  if (mode === 'quiz') {
    if (qIdx >= quizQuestions.length) {
      return (
        <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-xl font-bold text-gray-800">Kết quả trắc nghiệm Kanji</p>
          <p className="text-3xl font-bold text-indigo-600 mt-3">{qScore}/{quizQuestions.length}</p>
          <p className="text-sm text-gray-500 mt-1">{Math.round((qScore / quizQuestions.length) * 100)}% đúng</p>
          <div className="flex gap-3 mt-6">
            <button onClick={startKanjiQuiz} className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow">Làm lại</button>
            <button onClick={() => setMode('flashcard')} className="px-5 py-2 bg-gray-200 rounded-xl font-medium">Quay lại</button>
          </div>
        </div>
      );
    }
    const q = quizQuestions[qIdx];
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">✍️ Trắc nghiệm Kanji</h1>
        <p className="text-sm text-gray-500 mb-6">Câu {qIdx + 1}/{quizQuestions.length} • Đúng: {qScore}</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-6 w-full max-w-md">
          <p className="text-sm text-gray-400 mb-1">{q.reading}</p>
          <p className="text-lg font-bold text-gray-800">{q.question}</p>
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
              <button key={i} disabled={qSelected !== null} onClick={() => {
                setQSelected(i);
                if (opt === q.correctKanji) setQScore((s) => s + 1);
                setTimeout(() => { setQSelected(null); setQIdx((idx) => idx + 1); }, 1200);
              }} className={`${cls} py-5 rounded-xl text-3xl font-bold transition-all shadow-sm`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // === SUMMARY ===
  if (remaining === 0) {
    return (
      <div className="min-h-screen p-4 pb-24 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-xl font-bold text-gray-800">Tổng kết Kanji Buổi {sessionId}</p>
        <p className="text-emerald-600 mt-2">✅ Thuộc: {done.size} | ❌ Chưa: {unknown.size}</p>
        <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
          <button onClick={startKanjiQuiz} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow">✍️ Trắc nghiệm từ ví dụ</button>
          <button onClick={() => { setDone(new Set()); setUnknown(new Set()); setIndex(0); setFlipped(false); }} className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium shadow">🔄 Học lại</button>
        </div>
        {unknown.size > 0 && (
          <div className="mt-6 w-full max-w-md text-left">
            <p className="font-bold text-red-500 mb-2">Cần ôn lại:</p>
            {[...unknown].map((i) => (
              <div key={i} className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100">
                <span className="text-2xl font-bold">{cards[i].kanji}</span>
                <span className="text-sm text-gray-500 ml-2">{cards[i].hanViet} — {cards[i].meaning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="h-[calc(100dvh-4rem)] p-3 flex flex-col items-center">
      <div className="w-full max-w-sm mb-1">
        <Link href="/schedule" className="text-sm text-gray-500 hover:text-indigo-500 transition-colors flex items-center gap-1">
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Quay lại
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">🈁 Kanji Buổi {sessionId}</h1>
      {/* Progress bar */}
      <div className="w-full max-w-sm mb-1">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Còn {remaining}/{cards.length}</span>
          <div className="flex gap-3 items-center">
            {isShuffled && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#6C63FF', color: 'white' }}>🔀 Đang trộn</span>}
            <button onClick={() => setMode('viewall')} className="text-gray-400 hover:text-indigo-500">📋 Tất cả</button>
            <button onClick={() => { const shuffled = [...cards]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; } setCards(shuffled); setIndex(0); setFlipped(false); setDone(new Set()); setUnknown(new Set()); setIsShuffled(true); }} className={isShuffled ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-500'}>🔀 Trộn</button>
            {isAdmin && <button onClick={() => setManaging(true)} className="text-gray-400 hover:text-red-500">🗑️ Quản lý</button>}
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(done.size / cards.length) * 100}%`, background: '#6C63FF' }} />
        </div>
      </div>

      <div className="w-full flex-1 my-2 relative" style={{ perspective: '1000px' }}>
        <div className="absolute inset-0 rounded-2xl" style={{ transformStyle: 'preserve-3d', transition: 'transform 0.3s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          {/* Front */}
          <div className="absolute inset-0 rounded-2xl shadow-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer select-none" style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)' }} onClick={() => setFlipped(f => !f)}>
            <span className="text-8xl font-bold text-white">{card.kanji}</span>
            <span className="text-lg text-amber-300/90 font-medium">{card.hanViet} — {card.meaning}</span>
          </div>
          {/* Back */}
          <div className="absolute inset-0 rounded-2xl shadow-xl p-4 overflow-y-auto cursor-pointer select-none" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(180deg, #2d3748 0%, #3d5a5a 100%)' }} onClick={() => setFlipped(f => !f)}>
            <div className="flex flex-col items-center relative w-full min-h-full">
              <span className="text-5xl font-bold text-white">{card.kanji}</span>
              <span className="text-lg mt-0.5 font-semibold"><span className="text-white">{card.hanViet}</span> <span className="text-amber-300">— {card.meaning}</span></span>
              <div className="text-center text-white/80 text-sm">
                {card.onyomi && <span className="mr-2">音: {toHiragana(card.onyomi)}</span>}
                {card.kunyomi && <span>訓: {card.kunyomi}</span>}
              </div>
              {card.mnemonic && (
                <div className="mt-2 rounded-lg p-2.5 w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-sm text-white" dangerouslySetInnerHTML={{ __html: '💡 ' + card.mnemonic.replace(/\*\*(.*?)\*\*/g, '<span class="text-amber-300 font-bold">$1</span>') }} />
                </div>
              )}
              {!editingMnemonic && (
                <button onClick={(e) => { e.stopPropagation(); setMnemonicText(card.mnemonic || ''); setEditingMnemonic(true); }} className="absolute top-1 right-1 cursor-pointer text-[11px] text-white/30 hover:text-white" aria-label="Sửa ghi nhớ">
                  ✏️
                </button>
              )}
              {editingMnemonic && (
                <div className="mt-1 w-full" onClick={(e) => e.stopPropagation()}>
                  <input type="text" value={mnemonicText} onChange={(e) => setMnemonicText(e.target.value)} placeholder="VD: Tay (扌) cầm vũ khí (殳) **ném**" className="w-full text-xs px-2 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none" />
                  <div className="flex gap-2 mt-1">
                    <button onClick={saveMnemonic} className="text-[11px] px-2 py-0.5 bg-emerald-400 text-white rounded" aria-label="Lưu ghi nhớ">💾</button>
                    <button onClick={() => setEditingMnemonic(false)} className="text-[11px] px-2 py-0.5 bg-white/20 text-white rounded" aria-label="Hủy">✕</button>
                  </div>
                </div>
              )}
              {/* Vocab */}
              <div className="mt-2 w-full space-y-1.5">
                {card.vocab.map((v, i) => (
                    <div key={i} className="rounded-lg p-2.5 relative" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <span className="absolute top-1.5 right-2 text-[9px] text-white/25">{i + 1}</span>
                      <div className="min-w-0">
                        <div className="text-[15px] font-bold text-white" dangerouslySetInnerHTML={{ __html: v.word.replace(new RegExp(`(${escapeRegex(v.highlight || card.kanji)})`, 'g'), '<span style="color:#facc15">$1</span>') }} />
                        <div className="text-[11px] text-white/40 mt-0.5">{(() => { const hl = v.highlightReading || toHiragana(card.onyomi || '') || toHiragana(card.kunyomi || ''); if (!hl) return v.reading; const parts = v.reading.split(new RegExp(`(${escapeRegex(hl)})`, 'g')); return parts.map((p, j) => p.toLowerCase() === hl.toLowerCase() ? <span key={j} style={{color:'#facc15'}}>{p}</span> : p); })()}</div>
                        <div className="text-xs text-white/70 mt-0.5">{(() => { if (!v.highlightMeaning) return v.meaning; const parts = v.meaning.split(new RegExp(`(${escapeRegex(v.highlightMeaning)})`, 'gi')); return parts.map((p, j) => p.toLowerCase() === v.highlightMeaning!.toLowerCase() ? <span key={j} style={{color:'#facc15'}}>{p}</span> : p); })()}</div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => { setIndex((index - 1 + cards.length) % cards.length); }} className="px-3 py-2 rounded-xl bg-gray-200 text-gray-600 text-sm font-medium">◀ Trước</button>
        <button onClick={() => next(false)} className="px-5 py-2 rounded-xl bg-red-500/80 text-white text-sm font-medium shadow">Chưa thuộc</button>
        <button onClick={() => next(true)} className="px-5 py-2 rounded-xl text-white text-sm font-medium shadow" style={{ background: '#22C55E' }}>Đã thuộc ✓</button>
        <button onClick={() => { setIndex((index + 1) % cards.length); }} className="px-3 py-2 rounded-xl bg-gray-200 text-gray-600 text-sm font-medium">Sau ▶</button>
      </div>

      <div className="mt-4 w-full max-w-sm">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(done.size / cards.length) * 100}%`, background: '#22C55E' }} />
        </div>
      </div>
    </div>
  );
}
