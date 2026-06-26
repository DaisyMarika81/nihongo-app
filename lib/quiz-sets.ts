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
    .select()
    .single();
  if (error) throw error;
  return data as QuizSet;
}

export async function updateQuizSet(id: string, name: string, items: QuizSetItem[]): Promise<QuizSet> {
  const { data, error } = await supabase
    .from('quiz_sets')
    .update({ name, items })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as QuizSet;
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
