'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { sessionCards } from '@/data/session-cards';
import { sessionGrammar } from '@/data/session-grammar';
import { sessionKanji } from '@/data/session-kanji';
import { getAllSessionData } from '@/lib/session-data';
import { listSessionsWithNotes } from '@/lib/schedule-notes';
import {
  schedule,
  vnTodayISO,
  formatScheduleDate,
  getSessionStatus,
} from '@/data/schedule';

type ContentFilter = 'all' | 'has' | 'empty' | 'today';
type CloudCounts = { flashcard: number; grammar: number; kanji: number };

function contentCounts(session: number, cloud: CloudCounts) {
  const flashcard = (sessionCards[session]?.length || 0) + cloud.flashcard;
  const grammar = (sessionGrammar[session]?.length || 0) + cloud.grammar;
  const kanji = (sessionKanji[session]?.length || 0) + cloud.kanji;
  return { flashcard, grammar, kanji, total: flashcard + grammar + kanji };
}

function emptyCloud(): CloudCounts {
  return { flashcard: 0, grammar: 0, kanji: 0 };
}

export default function SchedulePage() {
  const { isAdmin } = useAuth();
  const [cloudMap, setCloudMap] = useState<Map<number, CloudCounts>>(new Map());
  const [noteSessions, setNoteSessions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [todayVN, setTodayVN] = useState(() => vnTodayISO());
  const todayRef = useRef<HTMLDivElement | null>(null);
  const didScroll = useRef(false);

  useEffect(() => {
    // Refresh VN "today" when tab becomes visible (midnight VN while tab open)
    setTodayVN(vnTodayISO());
    const onVis = () => {
      if (document.visibilityState === 'visible') setTodayVN(vnTodayISO());
    };
    document.addEventListener('visibilitychange', onVis);
    const id = window.setInterval(() => setTodayVN(vnTodayISO()), 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    Promise.all([getAllSessionData(), listSessionsWithNotes()])
      .then(([rows, noteIds]) => {
        if (cancelled) return;
        const map = new Map<number, CloudCounts>();
        for (const row of rows) {
          if (row.session_num >= 9990) continue; // skip meta keys
          const cur = map.get(row.session_num) || emptyCloud();
          if (row.type === 'flashcard') cur.flashcard = row.count;
          else if (row.type === 'grammar') cur.grammar = row.count;
          else if (row.type === 'kanji') cur.kanji = row.count;
          map.set(row.session_num, cur);
        }
        setCloudMap(map);
        setNoteSessions(new Set(noteIds));
      })
      .catch(() => {
        if (!cancelled) setLoadError('Không tải được dữ liệu cloud. Đang hiện nội dung local.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll to today's session once data is ready
  useEffect(() => {
    if (loading || didScroll.current) return;
    if (todayRef.current) {
      didScroll.current = true;
      // slight delay so layout settles
      requestAnimationFrame(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [loading, todayVN]);

  const rows = useMemo(() => {
    return schedule.map((s) => {
      const cloud = cloudMap.get(s.session) || emptyCloud();
      const counts = contentCounts(s.session, cloud);
      const status = getSessionStatus(s.date, todayVN);
      const hasContent = counts.total > 0;
      const hasNote = noteSessions.has(s.session);
      return { ...s, counts, status, hasContent, hasNote, ...formatScheduleDate(s.date) };
    });
  }, [cloudMap, noteSessions, todayVN]);

  const pastCount = rows.filter((r) => r.status === 'past').length;
  const withContentCount = rows.filter((r) => r.hasContent).length;
  const calendarPct = Math.round((pastCount / schedule.length) * 100);

  const filtered = rows.filter((r) => {
    if (filter === 'has') return r.hasContent;
    if (filter === 'empty') return !r.hasContent;
    if (filter === 'today') return r.status === 'today';
    return true;
  });

  const todaySession = rows.find((r) => r.status === 'today');

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📅 Lịch học</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {schedule.length} buổi • 3 buổi/tuần (T3, T5, T7)
              <span className="text-gray-300 mx-1.5">·</span>
              <span className="text-[11px] text-gray-400" title="Múi giờ lịch">
                VN (UTC+7) · {todayVN.split('-').reverse().join('/')}
              </span>
            </p>
          </div>
          {todaySession && (
            <button
              type="button"
              onClick={() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all"
            >
              ↓ Hôm nay
            </button>
          )}
        </div>

        {/* Progress — calendar timeline, not study mastery */}
        <div className="mb-4 mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-medium">
              Đã qua lịch: {pastCount} / {schedule.length}
              <span className="text-gray-300 mx-1.5">·</span>
              Có bài: {withContentCount}
            </span>
            <span className="font-bold" style={{ color: '#22C55E' }}>
              {calendarPct}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${calendarPct}%`,
                background: 'linear-gradient(90deg, #22C55E, #16A34A)',
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            % theo ngày lịch (giờ Việt Nam), không phải % đã học xong.
          </p>
        </div>

        {loadError && (
          <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            ⚠ {loadError}
          </p>
        )}

        <div className="flex gap-2 mb-3">
          <Link
            href="/schedule/quiz"
            className="flex-1 py-3 text-center bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow hover:shadow-md transition-all text-sm"
          >
            ✍️ Trắc nghiệm tổng hợp
          </Link>
          <Link
            href="/schedule/grammar-summary"
            className="flex-1 py-3 text-center bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium shadow hover:shadow-md transition-all text-sm"
          >
            📐 Tổng hợp ngữ pháp
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(
            [
              { key: 'all' as const, label: 'Tất cả' },
              { key: 'today' as const, label: 'Hôm nay' },
              { key: 'has' as const, label: 'Có bài' },
              { key: 'empty' as const, label: 'Trống' },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
          {loading && <span className="text-[11px] text-gray-400 self-center ml-1">Đang tải…</span>}
        </div>

        <div className="space-y-2.5">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">Không có buổi khớp bộ lọc</p>
          )}
          {filtered.map((s) => {
            const isToday = s.status === 'today';
            const isPast = s.status === 'past';
            const { flashcard, grammar, kanji } = s.counts;

            return (
              <div
                key={s.session}
                ref={isToday ? todayRef : undefined}
                className={`rounded-xl p-4 border-2 relative overflow-hidden transition-all bg-white ${
                  isToday
                    ? 'border-[rgba(108,99,255,0.5)] shadow-[0_0_24px_rgba(108,99,255,0.15)]'
                    : 'border-gray-200'
                } ${isPast && !s.hasContent ? 'opacity-50' : isPast ? 'opacity-80' : ''}`}
              >
                {isToday && (
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: '#6C63FF' }} />
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isToday ? 'text-white' : isPast ? 'text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                      style={
                        isToday
                          ? { background: '#6C63FF' }
                          : isPast && s.hasContent
                            ? { background: '#22C55E' }
                            : isPast
                              ? { background: '#9CA3AF' }
                              : {}
                      }
                    >
                      {s.session}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-[15px]">Buổi {s.session}</span>
                        {isToday && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border"
                            style={{
                              background: 'rgba(108,99,255,0.12)',
                              color: '#8B7CFF',
                              borderColor: 'rgba(108,99,255,0.25)',
                            }}
                          >
                            Hôm nay
                          </span>
                        )}
                        {isPast && s.hasContent && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                          >
                            ✓ Có bài
                          </span>
                        )}
                        {isPast && !s.hasContent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400">
                            Đã qua
                          </span>
                        )}
                        {s.status === 'future' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-sky-50 text-sky-500">
                            Sắp tới
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {s.day} • {s.display}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/schedule/${s.session}`}
                    className={`text-[11px] font-medium shrink-0 ${
                      s.hasNote ? 'text-indigo-600' : 'text-indigo-400 hover:text-indigo-300'
                    }`}
                  >
                    📝 Note{s.hasNote ? ' •' : ' ›'}
                  </Link>
                </div>

                {s.hasContent ? (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-12">
                    {flashcard > 0 && (
                      <Link
                        href={`/schedule/${s.session}/flashcard`}
                        className="text-[10px] px-2 py-1 rounded-md font-medium text-white bg-indigo-500"
                      >
                        🃏 Flashcard ({flashcard})
                      </Link>
                    )}
                    {grammar > 0 && (
                      <Link
                        href={`/schedule/${s.session}/grammar`}
                        className="text-[10px] px-2 py-1 rounded-md font-medium text-white bg-violet-500"
                      >
                        📐 Ngữ pháp ({grammar})
                      </Link>
                    )}
                    {kanji > 0 && (
                      <Link
                        href={`/schedule/${s.session}/kanji-fc`}
                        className="text-[10px] px-2 py-1 rounded-md font-medium text-white bg-rose-500"
                      >
                        🈁 Kanji ({kanji})
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href={`/upload?session=${s.session}`}
                        className="text-[10px] px-1.5 py-1 text-gray-400 hover:text-gray-600"
                      >
                        ➕
                      </Link>
                    )}
                    <Link
                      href={`/export?session=${s.session}`}
                      className="text-[10px] px-1.5 py-1 text-gray-400 hover:text-gray-600"
                    >
                      🖨️
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-2.5 pl-12">
                    <span className="text-[10px] text-gray-400 mr-1">Chưa có bài</span>
                    {isAdmin && (
                      <Link
                        href={`/upload?session=${s.session}`}
                        className="text-[10px] px-2 py-1 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-md"
                      >
                        ➕ Thêm
                      </Link>
                    )}
                    <Link
                      href={`/export?session=${s.session}`}
                      className="text-[10px] px-2 py-1 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-md"
                    >
                      🖨️ In
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
