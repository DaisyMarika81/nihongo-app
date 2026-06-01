import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

export async function POST(req: NextRequest) {
  const { messages, images } = await req.json();

  // Build parts array
  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];

  // Add images if any
  if (images?.length) {
    for (const img of images) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }
  }

  // Add text
  const lastMsg = messages[messages.length - 1]?.content || '';
  parts.push({ text: lastMsg });

  // Build conversation history
  const contents = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  contents.push({ role: 'user', parts });

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: 'Bạn là trợ lý học tiếng Nhật. Trả lời bằng tiếng Việt. Giúp giải thích kanji, ngữ pháp, từ vựng. Nếu người dùng gửi ảnh, hãy phân tích nội dung tiếng Nhật trong ảnh.' }] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi';
  return NextResponse.json({ text });
}
