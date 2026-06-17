import { supabase } from './supabase';

export type SessionDataType = 'flashcard' | 'grammar' | 'kanji';

export async function getSessionData(sessionNum: number, type: SessionDataType): Promise<unknown[]> {
  const { data } = await supabase
    .from('session_data')
    .select('items')
    .eq('session_num', sessionNum)
    .eq('type', type)
    .single();
  return data?.items || [];
}

export async function addSessionData(sessionNum: number, type: SessionDataType, newItems: unknown[]): Promise<void> {
  const existing = await getSessionData(sessionNum, type);
  const merged = [...existing, ...newItems];

  await supabase
    .from('session_data')
    .upsert({
      session_num: sessionNum,
      type,
      items: merged,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_num,type' });
}

export async function deleteAllSessionData(sessionNum: number, type: SessionDataType): Promise<void> {
  await supabase.from('session_data').delete().eq('session_num', sessionNum).eq('type', type);
}

export async function deleteSessionItem(sessionNum: number, type: SessionDataType, index: number): Promise<void> {
  const existing = await getSessionData(sessionNum, type);
  existing.splice(index, 1);

  if (existing.length === 0) {
    await supabase.from('session_data').delete().eq('session_num', sessionNum).eq('type', type);
  } else {
    await supabase.from('session_data')
      .update({ items: existing, updated_at: new Date().toISOString() })
      .eq('session_num', sessionNum).eq('type', type);
  }
}

export async function getAllSessionData(): Promise<{ session_num: number; type: string; count: number }[]> {
  const { data } = await supabase.from('session_data').select('session_num, type, items');
  return (data || []).map(d => ({ session_num: d.session_num, type: d.type, count: (d.items as unknown[]).length }));
}

export async function getRestrictMode(): Promise<boolean> {
  const { data } = await supabase.from('session_data').select('items').eq('session_num', 9999).eq('type', 'flashcard').single();
  return (data?.items as { restrict?: boolean })?.restrict ?? false;
}

export async function setRestrictMode(value: boolean): Promise<void> {
  await supabase.from('session_data').upsert({ session_num: 9999, type: 'flashcard', items: { restrict: value }, updated_at: new Date().toISOString() }, { onConflict: 'session_num,type' });
}
