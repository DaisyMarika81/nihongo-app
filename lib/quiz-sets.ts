import { supabase } from './supabase';

export type QuizSetItem = { kanji: string; meaning: string };

export type QuizSet = {
  id: string;
  name: string;
  items: QuizSetItem[];
  created_at: string;
};

export async function getQuizSets(): Promise<QuizSet[]> {
  const { data, error } = await supabase
    .from('quiz_sets')
    .select('id, name, items, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as QuizSet[];
}

export async function saveQuizSet(name: string, items: QuizSetItem[]): Promise<QuizSet> {
  const { data, error } = await supabase
    .from('quiz_sets')
    .insert({ name, items })
    .select('id, name, items, created_at');
  if (error) throw new Error(error.message || 'Không lưu được quiz set');
  if (!data?.length) {
    throw new Error(
      'Insert 0 dòng — bảng quiz_sets có thể bị RLS chặn INSERT. Chạy file supabase-quiz-sets.sql trong Supabase SQL Editor.'
    );
  }
  return data[0] as QuizSet;
}

export async function updateQuizSet(id: string, name: string, items: QuizSetItem[]): Promise<QuizSet> {
  // Avoid .single() — 0 rows (RLS/no match) becomes a clearer app error than PostgREST coerce message
  const { data, error } = await supabase
    .from('quiz_sets')
    .update({ name, items })
    .eq('id', id)
    .select('id, name, items, created_at');
  if (error) throw new Error(error.message || 'Không cập nhật được quiz set');
  if (!data?.length) {
    throw new Error(
      'Cập nhật 0 dòng — bảng quiz_sets có thể bị RLS chặn UPDATE. Chạy file supabase-quiz-sets.sql trong Supabase SQL Editor.'
    );
  }
  return data[0] as QuizSet;
}

export async function deleteQuizSet(id: string): Promise<void> {
  const { error } = await supabase.from('quiz_sets').delete().eq('id', id);
  if (error) throw error;
}

export async function getQuizOrder(): Promise<string[]> {
  const { data } = await supabase.from('session_data').select('items').eq('session_num', 9998).eq('type', 'flashcard').single();
  return (data?.items as { order?: string[] })?.order || [];
}

export async function saveQuizOrder(orderedIds: string[]): Promise<void> {
  await supabase.from('session_data').upsert({ session_num: 9998, type: 'flashcard', items: { order: orderedIds }, updated_at: new Date().toISOString() }, { onConflict: 'session_num,type' });
}

export async function reorderQuizSets(orderedIds: string[]): Promise<void> {
  await saveQuizOrder(orderedIds);
}
