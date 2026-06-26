import { supabase } from './supabase';

type ScheduleNote = {
  id: string;
  session_num: number;
  content: string;
  updated_at: string;
};

export async function loadCloudNote(sessionNum: number): Promise<string | null> {
  const { data } = await supabase
    .from('schedule_notes')
    .select('content')
    .eq('session_num', sessionNum)
    .single();
  return data?.content ?? null;
}

export async function saveCloudNote(sessionNum: number, content: string): Promise<void> {
  await supabase
    .from('schedule_notes')
    .upsert(
      { session_num: sessionNum, content, updated_at: new Date().toISOString() },
      { onConflict: 'session_num' },
    );
}
