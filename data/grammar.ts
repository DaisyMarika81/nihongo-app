export type GrammarEntry = {
  id: string;
  lesson: number;
  pattern: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
};

export const grammar: GrammarEntry[] = [
  // Lesson 1
  { id: 'l1-1', lesson: 1, pattern: 'N は N です', meaning: 'N là N (khẳng định)', example: 'わたしは学生です。', exampleMeaning: 'Tôi là sinh viên.' },
  { id: 'l1-2', lesson: 1, pattern: 'N の N', meaning: 'N của N (bổ nghĩa danh từ)', example: '東京大学の学生です。', exampleMeaning: 'Là sinh viên trường đại học Tokyo.' },
  // Lesson 2
  { id: 'l2-1', lesson: 2, pattern: 'これ/それ/あれ は N です', meaning: 'Cái này/đó/kia là N', example: 'これは本です。', exampleMeaning: 'Đây là quyển sách.' },
  { id: 'l2-2', lesson: 2, pattern: 'N は N ですか、N ですか', meaning: 'N là N hay N? (câu hỏi lựa chọn)', example: 'これはボールペンですか、シャープペンシルですか。', exampleMeaning: 'Đây là bút bi hay bút chì bấm?' },
  // Lesson 3
  { id: 'l3-1', lesson: 3, pattern: 'ここ/そこ/あそこ は N です', meaning: 'Chỗ này/đó/kia là N', example: 'ここはデパートです。', exampleMeaning: 'Đây là cửa hàng bách hóa.' },
  { id: 'l3-2', lesson: 3, pattern: 'N は どこ ですか', meaning: 'N ở đâu?', example: 'トイレはどこですか。', exampleMeaning: 'Nhà vệ sinh ở đâu?' },
  // Lesson 4
  { id: 'l4-1', lesson: 4, pattern: 'V ます/ません/ました/ませんでした', meaning: 'Động từ thể lịch sự (hiện tại/phủ định/quá khứ)', example: '毎日勉強します。', exampleMeaning: 'Hàng ngày tôi học.' },
  { id: 'l4-2', lesson: 4, pattern: 'N 時 から N 時 まで V', meaning: 'Làm V từ ... giờ đến ... giờ', example: '9時から5時まで働きます。', exampleMeaning: 'Tôi làm việc từ 9 giờ đến 5 giờ.' },
  // Lesson 5
  { id: 'l5-1', lesson: 5, pattern: 'N（場所）へ 行きます/来ます/帰ります', meaning: 'Đi/đến/về N (nơi chốn)', example: '京都へ行きます。', exampleMeaning: 'Tôi đi Kyoto.' },
  { id: 'l5-2', lesson: 5, pattern: 'N で V', meaning: 'V bằng phương tiện N', example: 'バスで会社へ行きます。', exampleMeaning: 'Tôi đi công ty bằng xe buýt.' },
  // Lesson 6
  { id: 'l6-1', lesson: 6, pattern: 'N を V ます', meaning: 'Làm V đối tượng N', example: 'ジュースを飲みます。', exampleMeaning: 'Tôi uống nước trái cây.' },
  { id: 'l6-2', lesson: 6, pattern: 'N で V ます', meaning: 'Làm V ở địa điểm N', example: '駅でNewspaperを買います。', exampleMeaning: 'Tôi mua báo ở ga.' },
  // Lesson 7
  { id: 'l7-1', lesson: 7, pattern: 'N に N を あげます', meaning: 'Cho ai cái gì', example: '友達に花をあげます。', exampleMeaning: 'Tôi tặng hoa cho bạn.' },
  { id: 'l7-2', lesson: 7, pattern: 'N に N を もらいます', meaning: 'Nhận cái gì từ ai', example: '母にセーターをもらいました。', exampleMeaning: 'Tôi nhận được áo len từ mẹ.' },
  // Lesson 8
  { id: 'l8-1', lesson: 8, pattern: 'い-adj です', meaning: 'Tính từ đuôi い (khẳng định)', example: 'この本はおもしろいです。', exampleMeaning: 'Quyển sách này thú vị.' },
  { id: 'l8-2', lesson: 8, pattern: 'な-adj です', meaning: 'Tính từ đuôi な (khẳng định)', example: '奈良は静かな町です。', exampleMeaning: 'Nara là thành phố yên tĩnh.' },
  // Lesson 9
  { id: 'l9-1', lesson: 9, pattern: 'N が 好きです/嫌いです', meaning: 'Thích/ghét N', example: 'わたしは音楽が好きです。', exampleMeaning: 'Tôi thích âm nhạc.' },
  { id: 'l9-2', lesson: 9, pattern: 'N が 上手です/下手です', meaning: 'Giỏi/kém N', example: '田中さんは英語が上手です。', exampleMeaning: 'Anh Tanaka giỏi tiếng Anh.' },
  // Lesson 10
  { id: 'l10-1', lesson: 10, pattern: 'N（場所）に N が あります/います', meaning: 'Ở N có N (vật/người)', example: '部屋に机があります。', exampleMeaning: 'Trong phòng có cái bàn.' },
  { id: 'l10-2', lesson: 10, pattern: 'N は N（場所）に あります/います', meaning: 'N ở tại N (nơi chốn)', example: '猫は庭にいます。', exampleMeaning: 'Con mèo ở trong vườn.' },
  // Lesson 11
  { id: 'l11-1', lesson: 11, pattern: 'N（数量）が あります/います', meaning: 'Có bao nhiêu N (đếm số lượng)', example: 'りんごが3つあります。', exampleMeaning: 'Có 3 quả táo.' },
  { id: 'l11-2', lesson: 11, pattern: '期間 に N 回 V', meaning: 'Làm V N lần trong khoảng thời gian', example: '1か月に2回映画を見ます。', exampleMeaning: 'Tôi xem phim 2 lần một tháng.' },
  // Lesson 12
  { id: 'l12-1', lesson: 12, pattern: 'N は N より adj です', meaning: 'N thì adj hơn N (so sánh hơn)', example: '東京は大阪より大きいです。', exampleMeaning: 'Tokyo lớn hơn Osaka.' },
  { id: 'l12-2', lesson: 12, pattern: 'N の中で N が いちばん adj', meaning: 'Trong N thì N là adj nhất (so sánh nhất)', example: '果物の中でりんごがいちばん好きです。', exampleMeaning: 'Trong các loại trái cây tôi thích táo nhất.' },
  // Lesson 13
  { id: 'l13-1', lesson: 13, pattern: 'N が ほしいです', meaning: 'Muốn có N', example: '新しい車がほしいです。', exampleMeaning: 'Tôi muốn có xe mới.' },
  { id: 'l13-2', lesson: 13, pattern: 'V たいです', meaning: 'Muốn làm V', example: '日本へ行きたいです。', exampleMeaning: 'Tôi muốn đi Nhật.' },
  // Lesson 14
  { id: 'l14-1', lesson: 14, pattern: 'V て ください', meaning: 'Hãy làm V (yêu cầu lịch sự)', example: 'ちょっと待ってください。', exampleMeaning: 'Xin hãy đợi một chút.' },
  { id: 'l14-2', lesson: 14, pattern: 'V て います', meaning: 'Đang làm V (trạng thái tiếp diễn)', example: '今、本を読んでいます。', exampleMeaning: 'Bây giờ tôi đang đọc sách.' },
  // Lesson 15
  { id: 'l15-1', lesson: 15, pattern: 'V ても いいです', meaning: 'Được phép làm V', example: 'ここで写真を撮ってもいいですか。', exampleMeaning: 'Ở đây có được chụp ảnh không?' },
  { id: 'l15-2', lesson: 15, pattern: 'V ては いけません', meaning: 'Không được phép làm V', example: 'ここでたばこを吸ってはいけません。', exampleMeaning: 'Không được hút thuốc ở đây.' },
  // Lesson 16
  { id: 'l16-1', lesson: 16, pattern: 'V て、V て、V', meaning: 'Nối các hành động liên tiếp bằng て', example: '朝起きて、顔を洗って、朝ごはんを食べます。', exampleMeaning: 'Sáng dậy, rửa mặt, rồi ăn sáng.' },
  { id: 'l16-2', lesson: 16, pattern: 'A は B が adj', meaning: 'A thì B adj (miêu tả đặc điểm)', example: '大阪は食べ物がおいしいです。', exampleMeaning: 'Osaka thì đồ ăn ngon.' },
  // Lesson 17
  { id: 'l17-1', lesson: 17, pattern: 'V ない形', meaning: 'Thể ない (phủ định thể thường)', example: '明日学校へ行かない。', exampleMeaning: 'Ngày mai tôi không đi học.' },
  { id: 'l17-2', lesson: 17, pattern: 'V ないで ください', meaning: 'Xin đừng làm V', example: 'ここに車を止めないでください。', exampleMeaning: 'Xin đừng đỗ xe ở đây.' },
  // Lesson 18
  { id: 'l18-1', lesson: 18, pattern: 'N/V（辞書形）こと が できます', meaning: 'Có thể làm V / biết làm N', example: '日本語を話すことができます。', exampleMeaning: 'Tôi có thể nói tiếng Nhật.' },
  { id: 'l18-2', lesson: 18, pattern: 'V（辞書形）前に、V', meaning: 'Trước khi V1 thì V2', example: '寝る前に、本を読みます。', exampleMeaning: 'Trước khi ngủ, tôi đọc sách.' },
  // Lesson 19
  { id: 'l19-1', lesson: 19, pattern: 'V た形 ことが あります', meaning: 'Đã từng làm V (kinh nghiệm)', example: '富士山に登ったことがあります。', exampleMeaning: 'Tôi đã từng leo núi Phú Sĩ.' },
  { id: 'l19-2', lesson: 19, pattern: 'V たり V たり します', meaning: 'Làm V1, V2, v.v. (liệt kê hành động)', example: '日曜日は本を読んだり、音楽を聞いたりします。', exampleMeaning: 'Chủ nhật tôi đọc sách, nghe nhạc, v.v.' },
  // Lesson 20
  { id: 'l20-1', lesson: 20, pattern: '普通形（plain form）', meaning: 'Thể thường (dùng trong hội thoại thân mật)', example: 'あした東京へ行く。', exampleMeaning: 'Ngày mai đi Tokyo.' },
  { id: 'l20-2', lesson: 20, pattern: '普通形 と思います', meaning: 'Tôi nghĩ rằng... (ý kiến)', example: '明日は雨が降ると思います。', exampleMeaning: 'Tôi nghĩ ngày mai trời sẽ mưa.' },
  // Lesson 21
  { id: 'l21-1', lesson: 21, pattern: '普通形 と言いました', meaning: 'Ai đó đã nói rằng...', example: '田中さんはパーティーに行くと言いました。', exampleMeaning: 'Anh Tanaka nói rằng sẽ đi dự tiệc.' },
  { id: 'l21-2', lesson: 21, pattern: '普通形 でしょう？', meaning: '... phải không? (xác nhận)', example: '明日は日曜日でしょう？', exampleMeaning: 'Ngày mai là chủ nhật phải không?' },
  // Lesson 22
  { id: 'l22-1', lesson: 22, pattern: '連体修飾（N を修飾する文）', meaning: 'Mệnh đề bổ nghĩa cho danh từ', example: 'わたしが昨日買った本はおもしろいです。', exampleMeaning: 'Quyển sách tôi mua hôm qua thú vị.' },
  { id: 'l22-2', lesson: 22, pattern: 'V（辞書形）時間/約束/用事', meaning: 'Thời gian/hẹn/việc để V', example: '本を読む時間がありません。', exampleMeaning: 'Tôi không có thời gian đọc sách.' },
  // Lesson 23
  { id: 'l23-1', lesson: 23, pattern: 'V（辞書形）とき、～', meaning: 'Khi V thì ~', example: '図書館で本を借りるとき、カードが要ります。', exampleMeaning: 'Khi mượn sách ở thư viện thì cần thẻ.' },
  { id: 'l23-2', lesson: 23, pattern: 'V（辞書形）と、～', meaning: 'Nếu/khi V thì ~ (tự nhiên, tất yếu)', example: 'このボタンを押すと、ドアが開きます。', exampleMeaning: 'Nếu nhấn nút này thì cửa sẽ mở.' },
  // Lesson 24
  { id: 'l24-1', lesson: 24, pattern: 'V て くれます', meaning: 'Ai đó làm V cho tôi (biết ơn)', example: '友達が空港まで送ってくれました。', exampleMeaning: 'Bạn đã đưa tôi đến sân bay.' },
  { id: 'l24-2', lesson: 24, pattern: 'V て もらいます', meaning: 'Nhờ ai đó làm V (nhận ơn)', example: '先生に作文を直してもらいました。', exampleMeaning: 'Tôi nhờ thầy sửa bài văn.' },
  // Lesson 25
  { id: 'l25-1', lesson: 25, pattern: 'V たら、～', meaning: 'Nếu/khi V xong thì ~ (điều kiện)', example: '雨が降ったら、出かけません。', exampleMeaning: 'Nếu trời mưa thì tôi không đi ra ngoài.' },
  { id: 'l25-2', lesson: 25, pattern: 'V ても、～', meaning: 'Dù V thì vẫn ~ (nhượng bộ)', example: '薬を飲んでも、熱が下がりません。', exampleMeaning: 'Dù uống thuốc nhưng sốt vẫn không hạ.' },
  // Lesson 26
  { id: 'l26-1', lesson: 26, pattern: 'V た/ない + んですが', meaning: 'Giải thích lý do/hoàn cảnh khi nhờ vả', example: 'パスポートをなくしたんですが、どうしたらいいですか。', exampleMeaning: 'Tôi bị mất hộ chiếu, phải làm sao?' },
  { id: 'l26-2', lesson: 26, pattern: 'V（て形）いただけませんか', meaning: 'Bạn có thể làm V giúp tôi được không? (rất lịch sự)', example: 'この漢字の読み方を教えていただけませんか。', exampleMeaning: 'Bạn có thể chỉ cách đọc chữ Hán này không?' },
  // Lesson 27
  { id: 'l27-1', lesson: 27, pattern: '可能動詞（V potential）', meaning: 'Thể khả năng (có thể V)', example: '日本語が話せます。', exampleMeaning: 'Tôi nói được tiếng Nhật.' },
  { id: 'l27-2', lesson: 27, pattern: '見えます/聞こえます', meaning: 'Nhìn thấy/nghe thấy (tự nhiên)', example: 'ここから山が見えます。', exampleMeaning: 'Từ đây nhìn thấy núi.' },
  // Lesson 28
  { id: 'l28-1', lesson: 28, pattern: 'V ながら、V', meaning: 'Vừa V1 vừa V2', example: '音楽を聞きながら、勉強します。', exampleMeaning: 'Tôi vừa nghe nhạc vừa học.' },
  { id: 'l28-2', lesson: 28, pattern: 'V て しまいます', meaning: 'Làm V xong hết / lỡ làm V (tiếc nuối)', example: '財布を落としてしまいました。', exampleMeaning: 'Tôi lỡ đánh rơi ví rồi.' },
  // Lesson 29
  { id: 'l29-1', lesson: 29, pattern: 'V て あります', meaning: 'Trạng thái kết quả của hành động (ai đó đã làm)', example: '窓が開けてあります。', exampleMeaning: 'Cửa sổ đã được mở sẵn.' },
  { id: 'l29-2', lesson: 29, pattern: 'V て おきます', meaning: 'Làm V sẵn/trước (chuẩn bị)', example: '旅行の前にホテルを予約しておきます。', exampleMeaning: 'Trước chuyến đi tôi đặt khách sạn trước.' },
  // Lesson 30
  { id: 'l30-1', lesson: 30, pattern: 'N に V て あります', meaning: 'N được V sẵn ở đó', example: '壁にカレンダーが掛けてあります。', exampleMeaning: 'Lịch được treo trên tường.' },
  { id: 'l30-2', lesson: 30, pattern: 'V て おきます（片付け）', meaning: 'Làm V để dọn dẹp/hoàn tất', example: '使ったら元の場所に戻しておいてください。', exampleMeaning: 'Sau khi dùng xong hãy để lại chỗ cũ.' },
  // Lesson 31
  { id: 'l31-1', lesson: 31, pattern: '意向形（V volitional）', meaning: 'Thể ý chí (hãy cùng V / định V)', example: '来週映画を見に行こう。', exampleMeaning: 'Tuần sau cùng đi xem phim nhé.' },
  { id: 'l31-2', lesson: 31, pattern: 'V（意向形）と思っています', meaning: 'Tôi đang định/dự định V', example: '来年日本へ行こうと思っています。', exampleMeaning: 'Tôi đang định sang năm đi Nhật.' },
  // Lesson 32
  { id: 'l32-1', lesson: 32, pattern: 'V た ほうが いいです', meaning: 'Nên làm V (khuyên nhủ)', example: '薬を飲んだほうがいいですよ。', exampleMeaning: 'Bạn nên uống thuốc đấy.' },
  { id: 'l32-2', lesson: 32, pattern: 'V ない ほうが いいです', meaning: 'Không nên làm V', example: '夜遅く食べないほうがいいです。', exampleMeaning: 'Không nên ăn khuya.' },
  // Lesson 33
  { id: 'l33-1', lesson: 33, pattern: '命令形/禁止形', meaning: 'Thể mệnh lệnh / cấm chỉ', example: '止まれ！ここに入るな！', exampleMeaning: 'Dừng lại! Cấm vào đây!' },
  { id: 'l33-2', lesson: 33, pattern: 'V と書いてあります/読みます', meaning: 'Viết/đọc là V', example: 'あの看板に「駐車禁止」と書いてあります。', exampleMeaning: 'Trên biển kia viết "Cấm đỗ xe".' },
  // Lesson 34
  { id: 'l34-1', lesson: 34, pattern: 'V1（た形）とおりに、V2', meaning: 'Làm V2 đúng theo V1', example: '先生が言ったとおりにしてください。', exampleMeaning: 'Hãy làm đúng như thầy nói.' },
  { id: 'l34-2', lesson: 34, pattern: 'V1 た あとで、V2', meaning: 'Sau khi V1 xong thì V2', example: '映画を見たあとで、食事しましょう。', exampleMeaning: 'Sau khi xem phim xong thì đi ăn nhé.' },
  // Lesson 35
  { id: 'l35-1', lesson: 35, pattern: '条件形（V ば）', meaning: 'Thể điều kiện ば (nếu V thì)', example: '安ければ、買います。', exampleMeaning: 'Nếu rẻ thì tôi mua.' },
  { id: 'l35-2', lesson: 35, pattern: 'V ば V ほど ～', meaning: 'Càng V thì càng ~', example: '練習すればするほど上手になります。', exampleMeaning: 'Càng luyện tập thì càng giỏi.' },
  // Lesson 36
  { id: 'l36-1', lesson: 36, pattern: 'V ように、V', meaning: 'Làm V2 để V1 (mục đích)', example: '忘れないように、メモします。', exampleMeaning: 'Tôi ghi chú để không quên.' },
  { id: 'l36-2', lesson: 36, pattern: 'V ようになりました', meaning: 'Trở nên có thể V (thay đổi)', example: '日本語が話せるようになりました。', exampleMeaning: 'Tôi đã nói được tiếng Nhật rồi.' },
  // Lesson 37
  { id: 'l37-1', lesson: 37, pattern: '受身形（passive）', meaning: 'Thể bị động', example: '電車で足を踏まれました。', exampleMeaning: 'Tôi bị giẫm chân trên tàu.' },
  { id: 'l37-2', lesson: 37, pattern: 'N は N に V（受身）', meaning: 'N bị N làm V', example: '弟に日記を読まれました。', exampleMeaning: 'Tôi bị em trai đọc nhật ký.' },
  // Lesson 38
  { id: 'l38-1', lesson: 38, pattern: 'V（辞書形）のは adj です', meaning: 'Việc V thì adj', example: '外国語を覚えるのは難しいです。', exampleMeaning: 'Việc học ngoại ngữ thì khó.' },
  { id: 'l38-2', lesson: 38, pattern: 'V（辞書形）のを忘れました', meaning: 'Quên làm V', example: '電気を消すのを忘れました。', exampleMeaning: 'Tôi quên tắt đèn.' },
  // Lesson 39
  { id: 'l39-1', lesson: 39, pattern: 'V て/V なくて、～（原因）', meaning: 'Vì V / vì không V nên ~ (nguyên nhân)', example: '電車が遅れて、遅刻しました。', exampleMeaning: 'Vì tàu trễ nên tôi đi muộn.' },
  { id: 'l39-2', lesson: 39, pattern: 'adj くて/で、～（原因）', meaning: 'Vì adj nên ~ (nguyên nhân)', example: '嬉しくて、泣きました。', exampleMeaning: 'Vì vui quá nên tôi khóc.' },
  // Lesson 40
  { id: 'l40-1', lesson: 40, pattern: '疑問詞 + V（た形）ら いいですか', meaning: 'Nên làm gì/thế nào? (hỏi lời khuyên)', example: 'どうしたらいいですか。', exampleMeaning: 'Tôi nên làm thế nào?' },
  { id: 'l40-2', lesson: 40, pattern: 'adj/V + かどうか', meaning: 'Có V/adj hay không (nghi vấn gián tiếp)', example: '明日雨が降るかどうかわかりません。', exampleMeaning: 'Tôi không biết ngày mai có mưa hay không.' },
  // Lesson 41
  { id: 'l41-1', lesson: 41, pattern: 'V て いただきます', meaning: 'Được ai đó làm V cho (khiêm nhường)', example: '社長に推薦状を書いていただきました。', exampleMeaning: 'Tôi được giám đốc viết thư giới thiệu.' },
  { id: 'l41-2', lesson: 41, pattern: 'V て くださいます', meaning: 'Ai đó làm V cho (kính ngữ)', example: '先生が説明してくださいました。', exampleMeaning: 'Thầy đã giải thích cho tôi.' },
  // Lesson 42
  { id: 'l42-1', lesson: 42, pattern: 'V（辞書形）ために、V', meaning: 'Để V1 (mục đích) thì V2', example: '家を買うために、貯金しています。', exampleMeaning: 'Để mua nhà, tôi đang tiết kiệm.' },
  { id: 'l42-2', lesson: 42, pattern: 'N に 使います/役に立ちます', meaning: 'Dùng cho N / có ích cho N', example: 'この道具は料理に使います。', exampleMeaning: 'Dụng cụ này dùng để nấu ăn.' },
  // Lesson 43
  { id: 'l43-1', lesson: 43, pattern: 'V そうです（様態）', meaning: 'Trông có vẻ sắp V / có vẻ adj', example: '雨が降りそうです。', exampleMeaning: 'Trông có vẻ sắp mưa.' },
  { id: 'l43-2', lesson: 43, pattern: 'V て きます', meaning: 'Đi làm V rồi quay lại', example: 'ちょっとコーヒーを買ってきます。', exampleMeaning: 'Tôi đi mua cà phê rồi quay lại.' },
  // Lesson 44
  { id: 'l44-1', lesson: 44, pattern: 'V すぎます', meaning: 'Làm V quá mức', example: '昨日お酒を飲みすぎました。', exampleMeaning: 'Hôm qua tôi uống rượu quá nhiều.' },
  { id: 'l44-2', lesson: 44, pattern: 'adj/V + やすい/にくい', meaning: 'Dễ/khó V', example: 'この辞書は使いやすいです。', exampleMeaning: 'Cuốn từ điển này dễ dùng.' },
  // Lesson 45
  { id: 'l45-1', lesson: 45, pattern: 'V た 場合は、～', meaning: 'Trong trường hợp V thì ~', example: '地震の場合は、エレベーターを使わないでください。', exampleMeaning: 'Trong trường hợp động đất, đừng dùng thang máy.' },
  { id: 'l45-2', lesson: 45, pattern: 'V の に（目的）', meaning: 'Để V (mục đích, đánh giá)', example: 'この鍋は揚げ物をするのに便利です。', exampleMeaning: 'Cái nồi này tiện để chiên đồ.' },
  // Lesson 46
  { id: 'l46-1', lesson: 46, pattern: 'V ところです', meaning: 'Đang ở thời điểm sắp/đang/vừa V', example: '今から出かけるところです。', exampleMeaning: 'Tôi sắp đi ra ngoài.' },
  { id: 'l46-2', lesson: 46, pattern: 'V た ばかりです', meaning: 'Vừa mới V xong', example: '日本に来たばかりです。', exampleMeaning: 'Tôi vừa mới đến Nhật.' },
  // Lesson 47
  { id: 'l47-1', lesson: 47, pattern: '普通形 そうです（伝聞）', meaning: 'Nghe nói rằng ~ (truyền đạt thông tin)', example: '天気予報によると、明日は寒くなるそうです。', exampleMeaning: 'Theo dự báo thời tiết, nghe nói ngày mai sẽ lạnh.' },
  { id: 'l47-2', lesson: 47, pattern: '普通形 ようです', meaning: 'Có vẻ như ~ (phán đoán dựa trên bằng chứng)', example: '隣の部屋にだれかいるようです。', exampleMeaning: 'Có vẻ như có ai đó ở phòng bên cạnh.' },
  // Lesson 48
  { id: 'l48-1', lesson: 48, pattern: '使役形（causative）', meaning: 'Thể sai khiến (bắt/cho ai làm V)', example: '部長は田中さんを出張させました。', exampleMeaning: 'Trưởng phòng bắt anh Tanaka đi công tác.' },
  { id: 'l48-2', lesson: 48, pattern: 'V（使役て形）ください', meaning: 'Xin hãy cho tôi làm V', example: 'わたしに説明させてください。', exampleMeaning: 'Xin hãy cho tôi giải thích.' },
  // Lesson 49
  { id: 'l49-1', lesson: 49, pattern: '尊敬語（respectful）', meaning: 'Kính ngữ (nói về hành động người trên)', example: '社長はもう帰られました。', exampleMeaning: 'Giám đốc đã về rồi.' },
  { id: 'l49-2', lesson: 49, pattern: 'お V になります', meaning: 'Kính ngữ dạng お V になる', example: '先生はもうこの本をお読みになりましたか。', exampleMeaning: 'Thầy đã đọc cuốn sách này chưa ạ?' },
  // Lesson 50
  { id: 'l50-1', lesson: 50, pattern: '謙譲語（humble）', meaning: 'Khiêm nhường ngữ (nói về hành động mình)', example: 'わたしが社長をご案内します。', exampleMeaning: 'Tôi xin hướng dẫn giám đốc.' },
  { id: 'l50-2', lesson: 50, pattern: 'お/ご V します', meaning: 'Khiêm nhường ngữ dạng お V する', example: 'お荷物をお持ちします。', exampleMeaning: 'Để tôi mang hành lý cho anh/chị.' },
];
