export type SessionGrammar = {
  id: string;
  pattern: string;
  meaning: string;
  example: string;
  exampleRomaji: string;
  exampleMeaning: string;
  note?: string;
};

export const sessionGrammar: Record<number, SessionGrammar[]> = {
  1: [
    {
      id: 'g1-1',
      pattern: 'V(bỏ ます) + ながら + V2',
      meaning: 'Vừa làm V1, vừa làm V2 (V2 là hành động chính)',
      example: '毎日 会社へ 通勤しながら、日本語を 勉強しています。',
      exampleRomaji: 'Mainichi kaisha he tsuukin nagara, nihongo wo benkyou shite imasu.',
      exampleMeaning: 'Hàng ngày, vừa đi làm đến công ty tôi vừa học tiếng Nhật.',
    },
    {
      id: 'g1-2a',
      pattern: 'V(bỏ ます) + そうです',
      meaning: 'Sắp sửa V / Có vẻ sắp V (suy đoán từ quan sát)',
      example: '今にも 雨が 降りそうです。',
      exampleRomaji: 'Ima ni mo ame ga furisou desu.',
      exampleMeaning: 'Trông có vẻ trời sắp mưa đến nơi rồi.',
      note: 'Dấu hiệu: 今にも (sắp đến nơi), もうすぐ (sắp sửa)',
    },
    {
      id: 'g1-2b',
      pattern: 'Adj-i(bỏ i) / Adj-na(bỏ na) + そうです',
      meaning: 'Trông có vẻ... (suy đoán từ vẻ ngoài)',
      example: 'この 料理は 美味しそうです。',
      exampleRomaji: 'Kono ryouri wa oishisou desu.',
      exampleMeaning: 'Món ăn này trông có vẻ ngon đấy.',
      note: 'Đặc biệt: いい → よさそう | ～ない → ～なさそう',
    },
    {
      id: 'g1-3',
      pattern: 'V(bỏ ます) + やすい / にくい',
      meaning: 'Dễ làm V / Khó làm V',
      example: 'この パソコンは 使いやすいです。',
      exampleRomaji: 'Kono pasokon wa tsukaiyasui desu.',
      exampleMeaning: 'Chiếc máy tính này rất dễ sử dụng.',
    },
    {
      id: 'g1-4',
      pattern: 'V(bỏ ます) + すぎます',
      meaning: 'Làm V quá mức / Quá...',
      example: '昨夜は お酒を 飲みすぎました。',
      exampleRomaji: 'Sakuya wa osake wo nomisugimashita.',
      exampleMeaning: 'Tối qua tôi đã uống quá nhiều rượu.',
    },
    {
      id: 'g1-5',
      pattern: 'Vた + ら いいですか',
      meaning: 'Làm như thế nào thì ổn? (Xin lời khuyên)',
      example: 'カメラを 買いたいんですが、どこで 買ったら いいですか。',
      exampleRomaji: 'Kamera wo kaitai n desu ga, doko de kattara ii desu ka.',
      exampleMeaning: 'Tôi muốn mua máy ảnh, tôi nên mua ở đâu thì tốt nhỉ?',
    },
    {
      id: 'g1-6',
      pattern: 'Vた + ほうが いいです / Vない + ほうが いいです',
      meaning: 'Nên làm / Không nên làm (khuyên bảo mạnh, không dùng với bề trên)',
      example: '毎日 運動した ほうが いいです。',
      exampleRomaji: 'Mainichi undou shita hou ga ii desu.',
      exampleMeaning: 'Bạn nên tập thể dục hàng ngày.',
      note: 'Nhẹ nhàng hơn: Vたら どうですか (Thử xem sao?)',
    },
    {
      id: 'g1-7a',
      pattern: 'Vる + ところです',
      meaning: 'Sắp sửa làm V',
      example: '今から 会議が はじまるところです。',
      exampleRomaji: 'Ima kara kaigi ga hajimaru tokoro desu.',
      exampleMeaning: 'Bây giờ cuộc họp chuẩn bị bắt đầu.',
    },
    {
      id: 'g1-7b',
      pattern: 'Vている + ところです',
      meaning: 'Đang làm V',
      example: '今 資料を 作っているところです。',
      exampleRomaji: 'Ima shiryou wo tsukutte iru tokoro desu.',
      exampleMeaning: 'Bây giờ tôi đang làm tài liệu.',
    },
    {
      id: 'g1-7c',
      pattern: 'Vた + ところです',
      meaning: 'Vừa mới làm xong V (vừa kết thúc tức thì)',
      example: 'さっき 昼ご飯を 食べたところです。',
      exampleRomaji: 'Sakki hirugohan wo tabeta tokoro desu.',
      exampleMeaning: 'Vừa nãy tôi mới ăn cơm trưa xong.',
      note: 'Dấu hiệu: さっき (vừa nãy), 今 (bây giờ)',
    },
    {
      id: 'g1-8',
      pattern: 'Vた + ばかり',
      meaning: 'Vừa mới xong V (cảm giác chủ quan "mới đây thôi")',
      example: 'この カメラは 先月 買ったばかりです。',
      exampleRomaji: 'Kono kamera wa sengetsu katta bakari desu.',
      exampleMeaning: 'Chiếc máy ảnh này tôi vừa mới mua tháng trước xong.',
      note: 'Khác ところ: ばかり dựa trên cảm giác, thời gian thực có thể đã lâu',
    },
    {
      id: 'g1-9a',
      pattern: 'Vた / Nの + あとで、V2',
      meaning: 'Sau khi làm V1 / Sau N, thì làm V2',
      example: '仕事の あとで、泳ぎに 行きます。',
      exampleRomaji: 'Shigoto no ato de, oyogi ni ikimasu.',
      exampleMeaning: 'Sau giờ làm việc, tôi sẽ đi bơi.',
    },
    {
      id: 'g1-9b',
      pattern: 'Vる / Nの + まえに、V2',
      meaning: 'Trước khi làm V1 / Trước N, thì làm V2',
      example: '日本に 行く まえに、日本語を 勉強します。',
      exampleRomaji: 'Nihon ni iku mae ni, nihongo wo benkyou shimasu.',
      exampleMeaning: 'Trước khi đi Nhật, tôi sẽ học tiếng Nhật.',
    },
  ],
};
