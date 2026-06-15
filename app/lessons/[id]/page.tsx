'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { vocabLessons1to10 } from '@/data/vocabulary/lessons-1-10';
import { vocabLessons11to25 } from '@/data/vocabulary/lessons-11-25';
import { vocabLessons26to40 } from '@/data/vocabulary/lessons-26-40';
import { vocabLessons41to50 } from '@/data/vocabulary/lessons-41-50';
import { grammar } from '@/data/grammar';
import { loadProgress, saveProgress, learnCard } from '@/lib/store';
import { speak } from '@/lib/speak';
import { addBookmark, removeBookmark, isBookmarked } from '@/lib/bookmarks';
import { getNote, saveNote } from '@/lib/notes';
import LessonChecklist from '@/app/components/LessonChecklist';
import Breadcrumb from '@/app/components/Breadcrumb';

const allVocab = [...vocabLessons1to10, ...vocabLessons11to25, ...vocabLessons26to40, ...vocabLessons41to50];

export default function LessonDetailPage() {
  const { id } = useParams();
  const lessonNum = parseInt(id as string);
  const [tab, setTab] = useState<'vocab' | 'grammar'>('vocab');
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const p = loadProgress();
    setLearnedIds(new Set(p.cards.map((c) => c.id)));
    const bm = new Set(allVocab.filter((w) => isBookmarked(`vocab-${w.japanese}`)).map((w) => w.japanese));
    setBookmarkedIds(bm);
  }, []);

  const words = allVocab.filter((v) => v.lesson === lessonNum);
  const grammarItems = grammar.filter((g) => g.lesson === lessonNum);

  function handleLearn(japanese: string) {
    const p = learnCard(loadProgress(), `vocab-${japanese}`);
    saveProgress(p);
    setLearnedIds(new Set(p.cards.map((c) => c.id)));
  }

  function handleLearnAll() {
    let p = loadProgress();
    words.forEach((w) => { p = learnCard(p, `vocab-${w.japanese}`); });
    saveProgress(p);
    setLearnedIds(new Set(p.cards.map((c) => c.id)));
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <Breadcrumb segments={[
        { href: '/lessons', label: 'Bài học' },
        { href: `/lessons/${lessonNum}`, label: `Bài ${lessonNum}` },
      ]} />
      <h1 className="text-2xl font-bold text-gray-800">Bài {lessonNum}</h1>

      <LessonChecklist lessonId={lessonNum} />

      <div className="flex gap-2 mt-4 mb-4">
        <button onClick={() => setTab('vocab')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'vocab' ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Từ vựng ({words.length})
        </button>
        <button onClick={() => setTab('grammar')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'grammar' ? 'bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Ngữ pháp ({grammarItems.length})
        </button>
      </div>

      {tab === 'vocab' && (
        <>
          <button onClick={handleLearnAll} className="mb-4 px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl text-sm font-medium shadow">
            ✨ Học tất cả
          </button>
          <div className="space-y-2">
            {words.map((w) => {
              const learned = learnedIds.has(`vocab-${w.japanese}`);
              return (
                <div key={w.japanese} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div>
                    <ruby className="text-xl font-bold text-gray-800">
                      {w.japanese}<rp>(</rp><rt className="text-xs text-indigo-400 font-normal">{w.reading}</rt><rp>)</rp>
                    </ruby>
                    <button onClick={() => speak(w.japanese)} className="ml-2 text-sm hover:scale-125 transition-transform inline-block">🔊</button>
                    <button onClick={() => {
                      const id = `vocab-${w.japanese}`;
                      if (bookmarkedIds.has(w.japanese)) { removeBookmark(id); bookmarkedIds.delete(w.japanese); }
                      else { addBookmark({ id, japanese: w.japanese, reading: w.reading, meaning: w.meaning, type: 'vocab' }); bookmarkedIds.add(w.japanese); }
                      setBookmarkedIds(new Set(bookmarkedIds));
                    }} className="ml-1 text-sm hover:scale-125 transition-transform inline-block">
                      {bookmarkedIds.has(w.japanese) ? '⭐' : '☆'}
                    </button>
                    <div className="text-sm text-gray-500 mt-1">{w.meaning}</div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{w.partOfSpeech}</span>
                    <NoteInput id={`vocab-${w.japanese}`} />
                  </div>
                  {learned ? (
                    <span className="text-emerald-500 text-sm font-medium">✓</span>
                  ) : (
                    <button onClick={() => handleLearn(w.japanese)} className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg font-medium hover:bg-indigo-200">
                      + Learn
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'grammar' && (
        <div className="space-y-3">
          {grammarItems.map((g) => (
            <div key={g.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="text-lg text-indigo-500 font-mono font-bold">{g.pattern}</div>
              <div className="text-sm text-gray-600 mt-1">{g.meaning}</div>
              <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-sm text-gray-800 font-medium">{g.example}</div>
                <div className="text-xs text-gray-500 mt-1">{g.exampleMeaning}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteInput({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => { setText(getNote(id)); }, [id]);

  return (
    <div className="mt-1">
      <button onClick={() => setOpen(!open)} className="text-[11px] text-gray-400 hover:text-indigo-500">
        {text ? '📝 Ghi chú' : '+ Ghi chú'}
      </button>
      {open && (
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); saveNote(id, e.target.value); }}
          placeholder="Ghi chú cá nhân..."
          className="mt-1 w-full text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />
      )}
      {!open && text && <p className="text-[11px] text-indigo-400 italic">{text}</p>}
    </div>
  );
}

