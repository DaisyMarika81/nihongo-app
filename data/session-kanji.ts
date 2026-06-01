export type SessionKanjiEntry = {
  kanji: string;
  hanViet: string;
  meaning: string;
  onyomi?: string;
  kunyomi?: string;
  mnemonic?: string;
  vocab: { word: string; reading: string; meaning: string; highlight?: string; highlightMeaning?: string; highlightReading?: string }[];
};

export const sessionKanji: Record<number, SessionKanjiEntry[]> = {};
