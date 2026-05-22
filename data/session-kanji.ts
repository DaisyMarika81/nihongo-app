export type SessionKanjiEntry = {
  kanji: string;
  hanViet: string;
  meaning: string;
  onyomi?: string;
  kunyomi?: string;
  vocab: { word: string; reading: string; meaning: string }[];
};

export const sessionKanji: Record<number, SessionKanjiEntry[]> = {
  1: [
    { kanji: '任', hanViet: 'NHIỆM', meaning: 'Giao phó', onyomi: 'ニン', kunyomi: 'まか(せる)', vocab: [{ word: '責任がある／ない', reading: 'せきにんがある／ない', meaning: 'Có/không có trách nhiệm' }, { word: '担任の先生', reading: 'たんにんのせんせい', meaning: 'Giáo viên chủ nhiệm' }, { word: '後輩に仕事を任せる', reading: 'こうはいにしごとをまかせる', meaning: 'Giao phó công việc cho đàn em' }] },
    { kanji: '信', hanViet: 'TÍN', meaning: 'Tin tưởng', onyomi: 'シン', kunyomi: 'しん(じる)', vocab: [{ word: '彼氏を信じる', reading: 'かれしをしんじる', meaning: 'Tin tưởng bạn trai' }, { word: '通信会社', reading: 'つうしんがいしゃ', meaning: 'Công ty viễn thông' }, { word: '彼は信用できる人だ', reading: 'かれはしんようできるひとだ', meaning: 'Anh ấy là người có thể tin tưởng được' }] },
    { kanji: '伸', hanViet: 'THÂN', meaning: 'Dài ra', onyomi: 'シン', kunyomi: 'の(びる)・の(ばす)', vocab: [{ word: '髪が伸びる', reading: 'かみがのびる', meaning: 'Tóc tự dài ra' }, { word: '足を伸ばす', reading: 'あしをのばす', meaning: 'Duỗi thẳng chân' }] },
    { kanji: '代', hanViet: 'ĐẠI', meaning: 'Thay thế', onyomi: 'ダイ・タイ', kunyomi: 'か(わる)・か(える)', vocab: [{ word: '学生代表', reading: 'がくせいだいひょう', meaning: 'Đại diện sinh viên' }, { word: '代金を払う', reading: 'だいきんをはらう', meaning: 'Trả tiền hàng' }, { word: '選手を代える', reading: 'せんしゅをかえる', meaning: 'Thay đổi tuyển thủ' }] },
    { kanji: '付', hanViet: 'PHÓ', meaning: 'Gắn vào', onyomi: 'フ', kunyomi: 'つ(ける)・つ(く)', vocab: [{ word: '東京駅付近のホテル', reading: 'とうきょうえきふきんのほてる', meaning: 'Khách sạn gần ga Tokyo' }, { word: 'マスクを付ける', reading: 'ますくをつける', meaning: 'Đeo khẩu trang' }, { word: 'シミが付いた服', reading: 'しみがついたふく', meaning: 'Quần áo bị dính vết bẩn' }] },
    { kanji: '件', hanViet: 'KIỆN', meaning: 'Sự kiện', onyomi: 'ケン', kunyomi: '', vocab: [{ word: '事件が起きる', reading: 'じけんがおきる', meaning: 'Vụ án xảy ra' }, { word: '「いい男」の条件', reading: '「いいおとこ」のじょうけん', meaning: 'Điều kiện của "người đàn ông tốt"' }] },
    { kanji: '位', hanViet: 'VỊ', meaning: 'Vị trí', onyomi: 'イ', kunyomi: 'くらい', vocab: [{ word: 'グーグルマップで位置を確認する', reading: 'ぐーぐるまっぷでいちをかくにんする', meaning: 'Xác nhận vị trí trên Google Maps' }, { word: '一位になる', reading: 'いちいになる', meaning: 'Lên Top 1' }, { word: '長さの単位', reading: 'ながさのたんい', meaning: 'Đơn vị chiều dài' }] },
    { kanji: '倍', hanViet: 'BỘI', meaning: 'Tăng gấp bội', onyomi: 'バイ', kunyomi: '', vocab: [{ word: '給料が何倍も上がる', reading: 'きゅうりょうがなんばいもあがる', meaning: 'Lương tăng gấp nhiều lần' }, { word: '4は2の2倍だ', reading: '4は2の2ばいだ', meaning: '4 là gấp 2 lần của 2' }] },
    { kanji: '保', hanViet: 'BẢO', meaning: 'Bảo vệ', onyomi: 'ホ', kunyomi: 'たも(つ)', vocab: [{ word: 'ファイルを保存する', reading: 'ふぁいるをほぞんする', meaning: 'Lưu trữ file' }, { word: '社会保険に入る', reading: 'しゃかいほけんにはいる', meaning: 'Tham gia bảo hiểm xã hội' }, { word: '健康を保つ', reading: 'けんこうをたもつ', meaning: 'Giữ gìn sức khỏe' }] },
    { kanji: '個', hanViet: 'CÁ', meaning: 'Cá tính', onyomi: 'コ', kunyomi: '', vocab: [{ word: '個性的な人', reading: 'こせいてきなひと', meaning: 'Người có cá tính' }, { word: '個人情報を保護する', reading: 'こじんじょうほうをほごする', meaning: 'Bảo vệ thông tin cá nhân' }, { word: '一個だけ食べてもいい？', reading: 'いっこだけたべてもいい？', meaning: 'Ăn một cái thôi được không?' }] },
  ],
};
