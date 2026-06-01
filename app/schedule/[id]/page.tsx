'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

const NOTES_KEY = 'nihongo_schedule_notes';

function loadNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(NOTES_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveNotes(notes: Record<string, string>) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export default function SessionNotePage() {
  const { id } = useParams();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const notes = loadNotes();
      notes[id as string] = editor.getHTML();
      saveNotes(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const notes = loadNotes();
    const content = notes[id as string] || '';
    editor.commands.setContent(content);
  }, [editor, id]);

  if (!editor) return null;

  return (
    <div className="min-h-screen p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Quay lại</button>
        <h1 className="text-lg font-bold text-gray-800">📝 Buổi {id}</h1>
        {saved && <span className="text-xs text-emerald-500">✓ Đã lưu</span>}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 mb-3 p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
        <button onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm font-bold ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          B
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm italic ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          I
        </button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded text-sm line-through ${editor.isActive('strike') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          S
        </button>
        <span className="w-px bg-gray-200 mx-1" />
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-sm font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          H1
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-sm font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          H2
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-sm font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          H3
        </button>
        <span className="w-px bg-gray-200 mx-1" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-sm ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          • List
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-sm ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          1. List
        </button>
        <button onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`px-2 py-1 rounded text-sm ${editor.isActive('taskList') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          ☑ Todo
        </button>
        <span className="w-px bg-gray-200 mx-1" />
        {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map((color) => (
          <button key={color} onClick={() => editor.chain().focus().setColor(color).run()}
            className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
        ))}
        <button onClick={() => editor.chain().focus().unsetColor().run()}
          className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100">Reset</button>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[400px] p-4">
        <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[360px]" />
      </div>
    </div>
  );
}
