# 🇯🇵 Nihongo App — Học tiếng Nhật (Minna no Nihongo)

Web app học tiếng Nhật theo giáo trình Minna no Nihongo (50 bài), với SRS flashcard, quiz, và daily session 1h/ngày.

**Live:** Deploy miễn phí trên Vercel

## Features

- 📖 **50 bài học** từ vựng + ngữ pháp Minna no Nihongo I & II
- 🔤 **Bảng Kana** đầy đủ Hiragana + Katakana (208 ký tự)
- 📇 **Flashcard SRS** — Spaced Repetition (thuật toán SM-2)
- ✍️ **Quiz** — 3 chế độ: Kana, Từ vựng, Ngữ pháp
- ⏱️ **Daily Session** — Lập kế hoạch học 60 phút/ngày
- 🔥 **Streak tracking** — Theo dõi chuỗi ngày học liên tục
- 💾 **Offline-first** — Data lưu localStorage, không cần đăng nhập
- 📤 **Export/Import** — Backup tiến trình dạng JSON

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **localStorage** (no backend needed)
- **Vercel** (deploy)

## Data

| Nguồn | Nội dung |
|--------|----------|
| Hiragana | 104 ký tự (cơ bản + dakuten + combo) |
| Katakana | 104 ký tự |
| Từ vựng | ~800 từ (50 bài × ~16 từ/bài) |
| Ngữ pháp | 100 mẫu câu (2/bài) |

## Getting Started

```bash
# Install
npm install

# Dev
npm run dev

# Build
npm run build

# Start
npm start
```

Mở http://localhost:3000

## Deploy lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → Import repository
3. Click Deploy — xong!

Hoặc dùng CLI:
```bash
npm i -g vercel
vercel
```

## Cấu trúc project

```
nihongo-app/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── flashcard/page.tsx    # SRS Flashcard
│   ├── quiz/page.tsx         # Quiz (3 modes)
│   ├── lessons/page.tsx      # Danh sách 50 bài
│   ├── lessons/[id]/page.tsx # Chi tiết bài học
│   ├── kana/page.tsx         # Bảng Hiragana/Katakana
│   ├── settings/page.tsx     # Cài đặt & backup
│   └── components/           # UI components
├── data/
│   ├── hiragana.ts           # Bảng Hiragana
│   ├── katakana.ts           # Bảng Katakana
│   ├── grammar.ts            # Ngữ pháp 50 bài
│   └── vocabulary/           # Từ vựng theo bài
├── lib/
│   ├── srs.ts                # SRS engine (SM-2)
│   ├── session.ts            # Daily session planner
│   └── store.ts              # Progress (localStorage)
└── package.json
```

## Cách sử dụng

1. **Bắt đầu:** Mở app → Dashboard hiển thị phiên học hôm nay
2. **Học bài mới:** Lessons → chọn bài → đọc từ vựng + ngữ pháp → click "Learn"
3. **Ôn tập:** Flashcard → lật thẻ → đánh giá (Again/Hard/Good/Easy)
4. **Kiểm tra:** Quiz → chọn mode → trả lời 10 câu
5. **Kana:** Học bảng chữ cái → đánh dấu đã thuộc

## License

MIT
