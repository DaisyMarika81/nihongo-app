'use client';

import { useState, useRef, useEffect } from 'react';
import { kanjiN5 } from '@/data/kanji';
import { kanjiN4, kanjiN4Part2 } from '@/data/kanji-n4';

const allKanji = [...kanjiN5, ...kanjiN4, ...kanjiN4Part2];

export default function WritePracticePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const kanji = allKanji[current];

  useEffect(() => { clearCanvas(); }, [current]);

  function clearCanvas() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const w = canvasRef.current.width, h = canvasRef.current.height;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();
    setShowAnswer(false);
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const pos = getPos(e);
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDraw() { setDrawing(false); }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function next() { setCurrent((c) => (c + 1) % allKanji.length); }
  function prev() { setCurrent((c) => (c - 1 + allKanji.length) % allKanji.length); }

  return (
    <div className="min-h-screen p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">✍️ Luyện viết Kanji</h1>

      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="px-3 py-1 bg-gray-200 rounded-lg text-sm">← Trước</button>
        <span className="text-sm text-gray-500">{current + 1}/{allKanji.length}</span>
        <button onClick={next} className="px-3 py-1 bg-gray-200 rounded-lg text-sm">Sau →</button>
      </div>

      <div className="text-center mb-3">
        <span className="text-sm text-gray-500">Viết: </span>
        <span className="font-bold text-lg text-indigo-600">{kanji.meaning}</span>
        <span className="text-sm text-gray-400 ml-2">({kanji.onyomi})</span>
      </div>

      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="border-2 border-gray-200 rounded-xl touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      <div className="flex justify-center gap-3 mb-4">
        <button onClick={clearCanvas} className="px-4 py-2 bg-gray-200 rounded-xl text-sm font-medium">🗑️ Xóa</button>
        <button onClick={() => setShowAnswer(!showAnswer)} className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-xl text-sm font-medium">
          {showAnswer ? '🙈 Ẩn' : '👁️ Đáp án'}
        </button>
        <button onClick={next} className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl text-sm font-medium shadow">Tiếp →</button>
      </div>

      {showAnswer && (
        <div className="text-center">
          <span className="text-8xl font-bold text-gray-300">{kanji.character}</span>
          <p className="text-sm text-gray-500 mt-2">{kanji.strokes} nét</p>
        </div>
      )}
    </div>
  );
}
