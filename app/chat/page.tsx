'use client';

import { useState, useRef } from 'react';

type Message = { role: 'user' | 'assistant'; content: string; images?: string[] };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<{ data: string; mimeType: string; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImages(prev => [...prev, { data: base64, mimeType: file.type, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  async function send() {
    if (!input.trim() && !images.length) return;
    const userMsg: Message = { role: 'user', content: input, images: images.map(i => i.preview) };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    const sentImages = [...images];
    setImages([]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          images: sentImages.map(i => ({ data: i.data, mimeType: i.mimeType })),
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.text || data.error || 'Lỗi' }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '❌ Lỗi kết nối' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-2xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-3xl mb-2">🤖</p>
            <p className="text-sm">Hỏi về Kanji, ngữ pháp, hoặc gửi ảnh tiếng Nhật để phân tích</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
              {m.images?.map((img, j) => <img key={j} src={img} className="rounded-lg mb-2 max-h-40" />)}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-400">Đang suy nghĩ...</div>
          </div>
        )}
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto">
          {images.map((img, i) => (
            <div key={i} className="relative shrink-0">
              <img src={img.preview} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
              <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200 flex gap-2 items-end">
        <button onClick={() => fileRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 shrink-0">📷</button>
        <input type="file" ref={fileRef} accept="image/*" multiple onChange={handleImages} className="hidden" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Hỏi về tiếng Nhật..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button onClick={send} disabled={loading} className="w-10 h-10 flex items-center justify-center rounded-xl text-white shrink-0 disabled:opacity-50" style={{ background: '#6C63FF' }}>↑</button>
      </div>
    </div>
  );
}
