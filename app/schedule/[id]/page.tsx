'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { sessionCards } from '@/data/session-cards';
import { sessionGrammar } from '@/data/session-grammar';
import { sessionKanji } from '@/data/session-kanji';

const NOTES_KEY = 'nihongo_schedule_notes';
const NOTES_META_KEY = 'nihongo_schedule_notes_meta';

const schedule = [
  { session: 1, date: '2026-05-19' }, { session: 2, date: '2026-05-21' }, { session: 3, date: '2026-05-23' },
  { session: 4, date: '2026-05-26' }, { session: 5, date: '2026-05-28' }, { session: 6, date: '2026-05-30' },
  { session: 7, date: '2026-06-02' }, { session: 8, date: '2026-06-04' }, { session: 9, date: '2026-06-06' },
  { session: 10, date: '2026-06-09' }, { session: 11, date: '2026-06-11' }, { session: 12, date: '2026-06-13' },
  { session: 13, date: '2026-06-16' }, { session: 14, date: '2026-06-18' }, { session: 15, date: '2026-06-20' },
  { session: 16, date: '2026-06-23' }, { session: 17, date: '2026-06-25' }, { session: 18, date: '2026-06-27' },
  { session: 19, date: '2026-06-30' }, { session: 20, date: '2026-07-02' }, { session: 21, date: '2026-07-04' },
  { session: 22, date: '2026-07-07' }, { session: 23, date: '2026-07-09' }, { session: 24, date: '2026-07-11' },
  { session: 25, date: '2026-07-14' }, { session: 26, date: '2026-07-16' }, { session: 27, date: '2026-07-18' },
  { session: 28, date: '2026-07-21' }, { session: 29, date: '2026-07-23' }, { session: 30, date: '2026-07-25' },
  { session: 31, date: '2026-07-28' }, { session: 32, date: '2026-07-30' }, { session: 33, date: '2026-08-01' },
  { session: 34, date: '2026-08-04' }, { session: 35, date: '2026-08-06' }, { session: 36, date: '2026-08-08' },
  { session: 37, date: '2026-08-11' }, { session: 38, date: '2026-08-13' }, { session: 39, date: '2026-08-15' },
  { session: 40, date: '2026-08-18' }, { session: 41, date: '2026-08-20' }, { session: 42, date: '2026-08-22' },
  { session: 43, date: '2026-08-25' }, { session: 44, date: '2026-08-27' }, { session: 45, date: '2026-08-29' },
];

const HIGHLIGHT_COLORS = [
  { color: '#fef08a', label: 'Vàng' },
  { color: '#bbf7d0', label: 'Xanh lá' },
  { color: '#bfdbfe', label: 'Xanh dương' },
  { color: '#fecaca', label: 'Đỏ' },
  { color: '#e9d5ff', label: 'Tím' },
];

const TEXT_COLORS = [
  { color: '#ef4444', label: 'Đỏ' },
  { color: '#f59e0b', label: 'Cam' },
  { color: '#10b981', label: 'Xanh lá' },
  { color: '#3b82f6', label: 'Xanh dương' },
  { color: '#8b5cf6', label: 'Tím' },
];

const NOTE_TEMPLATE = `<h2>📖 Từ vựng mới</h2><p></p><h2>📐 Ngữ pháp</h2><p></p><h2>💡 Lưu ý trong buổi học</h2><blockquote><p>Ghi chú các điểm cần lưu ý, thắc mắc hoặc giải thích thêm từ giáo viên...</p></blockquote><h2>✏️ Ví dụ & Ghi chú</h2><p></p><h2>✅ Bài tập về nhà</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Ôn tập từ vựng buổi hôm nay</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Làm bài tập ngữ pháp</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Luyện viết Kanji</p></div></li></ul>`;

function loadNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(NOTES_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveNotes(notes: Record<string, string>) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function loadMeta(): Record<string, { lastSaved: string }> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(NOTES_META_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveMeta(id: string) {
  const meta = loadMeta();
  meta[id] = { lastSaved: new Date().toISOString() };
  localStorage.setItem(NOTES_META_KEY, JSON.stringify(meta));
}

function formatSessionDate(dateStr: string) {
  const date = new Date(dateStr);
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = days[date.getDay()];
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${dayName}, ${d}/${m}/${y}`;
}

function formatLastSaved(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa lưu';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ trước`;
  return `${d.getDate()}/${d.getMonth() + 1} lúc ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// Toolbar button component
function ToolbarBtn({ onClick, active, tooltip, children, className = '' }: {
  onClick: () => void;
  active?: boolean;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`note-toolbar-btn ${active ? 'active' : ''} ${className}`}
      data-tooltip={tooltip}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-px h-5 bg-gray-200 mx-0.5 flex-shrink-0" />;
}

export default function SessionNotePage() {
  const { id } = useParams();
  const router = useRouter();
  const sessionNum = Number(id);
  const sessionInfo = schedule.find(s => s.session === sessionNum);
  const [saved, setSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);

  // Session content checks
  const hasCards = !!sessionCards[sessionNum]?.length;
  const hasGrammar = !!sessionGrammar[sessionNum]?.length;
  const hasKanji = !!sessionKanji[sessionNum]?.length;
  const cardCount = sessionCards[sessionNum]?.length || 0;
  const grammarCount = sessionGrammar[sessionNum]?.length || 0;
  const kanjiCount = sessionKanji[sessionNum]?.length || 0;
  const hasAnyContent = hasCards || hasGrammar || hasKanji;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Underline,
      Placeholder.configure({
        placeholder: 'Bắt đầu ghi chú cho buổi học này... (💡 Bấm "📋 Mẫu" để chèn template)',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const notes = loadNotes();
      notes[id as string] = editor.getHTML();
      saveNotes(notes);
      saveMeta(id as string);
      setSaved(true);
      setLastSaved(new Date().toISOString());
      setTimeout(() => setSaved(false), 1500);

      // Word count
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const notes = loadNotes();
    const content = notes[id as string] || '';
    editor.commands.setContent(content);

    // Load meta
    const meta = loadMeta();
    if (meta[id as string]) {
      setLastSaved(meta[id as string].lastSaved);
    }

    // Initial word count
    const text = editor.getText();
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, [editor, id]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
        setShowHighlightPicker(false);
      }
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setShowTemplatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const insertTemplate = useCallback(() => {
    if (!editor) return;
    const isEmpty = editor.getText().trim() === '';
    if (isEmpty) {
      editor.commands.setContent(NOTE_TEMPLATE);
    } else {
      editor.commands.insertContent(NOTE_TEMPLATE);
    }
    setShowTemplatePicker(false);
  }, [editor]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportText = useCallback(() => {
    if (!editor) return;
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buoi-${id}-note.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editor, id]);

  if (!editor) return null;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-indigo-500 transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Quay lại
          </button>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="save-indicator text-xs text-emerald-500 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Đã lưu
              </span>
            )}
          </div>
        </div>

        {/* Session info header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #6C63FF, #8B7CFF)' }}>
              {sessionNum}
            </span>
            Buổi {sessionNum}
          </h1>
          {sessionInfo && (
            <p className="text-xs text-gray-400 mt-1 ml-10">
              📅 {formatSessionDate(sessionInfo.date)}
            </p>
          )}
        </div>

        {/* Quick Links to session resources */}
        {hasAnyContent && (
          <div className="flex flex-wrap gap-2 mb-4">
            {hasCards && (
              <Link
                href={`/schedule/${sessionNum}/flashcard`}
                className="note-quick-link text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
              >
                🃏 Flashcard
                <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">{cardCount}</span>
              </Link>
            )}
            {hasGrammar && (
              <Link
                href={`/schedule/${sessionNum}/grammar`}
                className="note-quick-link text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}
              >
                📐 Ngữ pháp
                <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">{grammarCount}</span>
              </Link>
            )}
            {hasKanji && (
              <Link
                href={`/schedule/${sessionNum}/kanji-fc`}
                className="note-quick-link text-white"
                style={{ background: 'linear-gradient(135deg, #e11d48, #f43f5e)' }}
              >
                🈁 Kanji
                <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">{kanjiCount}</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Sticky Toolbar */}
          <div className="note-toolbar flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-100 bg-white/80">
            {/* Undo / Redo */}
            <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} tooltip="Hoàn tác (Ctrl+Z)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} tooltip="Làm lại (Ctrl+Y)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </ToolbarBtn>

            <ToolbarDivider />

            {/* Text formatting */}
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} tooltip="Đậm (Ctrl+B)">
              <strong>B</strong>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} tooltip="Nghiêng (Ctrl+I)">
              <em>I</em>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} tooltip="Gạch chân (Ctrl+U)">
              <span style={{ textDecoration: 'underline' }}>U</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} tooltip="Gạch ngang (Ctrl+Shift+X)">
              <s>S</s>
            </ToolbarBtn>

            <ToolbarDivider />

            {/* Headings */}
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} tooltip="Tiêu đề 1">
              <span className="font-bold text-[11px]">H1</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} tooltip="Tiêu đề 2">
              <span className="font-bold text-[11px]">H2</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} tooltip="Tiêu đề 3">
              <span className="font-bold text-[11px]">H3</span>
            </ToolbarBtn>

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} tooltip="Danh sách">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} tooltip="Danh sách đánh số">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">1</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">2</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">3</text></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} tooltip="Danh sách việc cần làm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="M5 8l1.5 1.5L9 6.5"/><line x1="13" y1="8" x2="21" y2="8"/><rect x="3" y="13" width="6" height="6" rx="1"/><line x1="13" y1="16" x2="21" y2="16"/></svg>
            </ToolbarBtn>

            <ToolbarDivider />

            {/* Block elements */}
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} tooltip="Trích dẫn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} tooltip="Khối code (Ctrl+Alt+C)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Đường kẻ ngang">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>
            </ToolbarBtn>

            <ToolbarDivider />

            {/* Highlight picker */}
            <div className="relative" ref={highlightRef}>
              <ToolbarBtn
                onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }}
                active={editor.isActive('highlight')}
                tooltip="Tô đánh dấu"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="18" width="20" height="4" rx="1" fill="#fef08a"/><path d="M6 14l8-8 4 4-8 8H6v-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </ToolbarBtn>
              {showHighlightPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex gap-1.5 z-30">
                  {HIGHLIGHT_COLORS.map((h) => (
                    <button
                      key={h.color}
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color: h.color }).run();
                        setShowHighlightPicker(false);
                      }}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: h.color }}
                      title={h.label}
                    />
                  ))}
                  <button
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run();
                      setShowHighlightPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 text-[10px] hover:bg-gray-100"
                    title="Xóa highlight"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Text color picker */}
            <div className="relative" ref={colorRef}>
              <ToolbarBtn
                onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }}
                tooltip="Màu chữ"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16"/><path d="M7 16L12 4l5 12"/><path d="M9.5 12h5"/></svg>
              </ToolbarBtn>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex gap-1.5 z-30">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.color}
                      onClick={() => {
                        editor.chain().focus().setColor(c.color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                  <button
                    onClick={() => {
                      editor.chain().focus().unsetColor().run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 text-[10px] hover:bg-gray-100"
                    title="Mặc định"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <ToolbarDivider />

            {/* Template & Export */}
            <div className="relative" ref={templateRef}>
              <ToolbarBtn
                onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                tooltip="Chèn template ghi chú"
              >
                <span className="text-[11px]">📋</span>
              </ToolbarBtn>
              {showTemplatePicker && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1 z-30 w-48">
                  <button
                    onClick={insertTemplate}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    📝 Mẫu ghi chú buổi học
                  </button>
                </div>
              )}
            </div>

            <ToolbarBtn onClick={handlePrint} tooltip="In / Xuất PDF">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </ToolbarBtn>
            <ToolbarBtn onClick={handleExportText} tooltip="Xuất file .txt">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </ToolbarBtn>
          </div>

          {/* Editor content + footer wrapper — overflow-hidden preserves bottom rounded corners */}
          <div className="overflow-hidden rounded-b-2xl">
            <div className="min-h-[450px] p-5">
              <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[420px]"
              />
            </div>

            {/* Footer with word count & last saved */}
            <div className="note-footer">
              <span>{wordCount} từ</span>
              <span>
                {lastSaved ? `💾 ${formatLastSaved(lastSaved)}` : 'Chưa có ghi chú'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation between sessions */}
        <div className="flex items-center justify-between mt-4 text-sm">
          {sessionNum > 1 ? (
            <Link
              href={`/schedule/${sessionNum - 1}`}
              className="text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Buổi {sessionNum - 1}
            </Link>
          ) : <div />}
          {sessionNum < 45 ? (
            <Link
              href={`/schedule/${sessionNum + 1}`}
              className="text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
            >
              Buổi {sessionNum + 1}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
