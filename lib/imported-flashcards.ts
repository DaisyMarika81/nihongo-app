'use client';

export type ImportedFlashcardType = 'kanji' | 'vocabulary';

export type ImportedFlashcard = {
  id: string;
  type: ImportedFlashcardType;
  kanji: string;
  hiragana: string;
  meaning: string;
};

const STORAGE_KEY = 'nihongo_imported_flashcards_v1';

export function loadImportedFlashcards(): ImportedFlashcard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cards = raw ? JSON.parse(raw) : [];
    return Array.isArray(cards) ? cards : [];
  } catch {
    return [];
  }
}

export function saveImportedFlashcards(cards: ImportedFlashcard[]): void {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function removeImportedFlashcards(type?: ImportedFlashcardType): void {
  const cards = loadImportedFlashcards();
  saveImportedFlashcards(type ? cards.filter((card) => card.type !== type) : []);
}

export function parseImportedFlashcards(json: string, type: ImportedFlashcardType): ImportedFlashcard[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('JSON không hợp lệ. Hãy kiểm tra dấu ngoặc và dấu phẩy.');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('JSON phải là một mảng có ít nhất 1 flashcard.');
  }

  const cards: ImportedFlashcard[] = [];
  for (let index = 0; index < parsed.length; index += 1) {
    const item = parsed[index];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Mục #${index + 1} phải là một object.`);
    }
    const record = item as Record<string, unknown>;
    const kanji = typeof record.kanji === 'string' ? record.kanji.trim() : '';
    const hiragana = typeof record.hiragana === 'string' ? record.hiragana.trim() : '';
    const meaning = typeof record.meaning === 'string' ? record.meaning.trim() : '';
    if (!kanji || !hiragana || !meaning) {
      throw new Error(`Mục #${index + 1} phải có đủ 3 field kanji, hiragana, meaning (chuỗi không rỗng).`);
    }
    cards.push({ id: `${type}-${kanji}-${index}-${Date.now()}`, type, kanji, hiragana, meaning });
  }
  return cards;
}

export const IMPORT_EXAMPLE = JSON.stringify([
  { kanji: '責任', hiragana: 'せきにん', meaning: 'trách nhiệm' },
  { kanji: '勉強', hiragana: 'べんきょう', meaning: 'học tập' },
], null, 2);
