'use client';

import { supabase } from './supabase';

export type UserData = {
  progress: string;
  bookmarks: string;
  notes: string;
  schedule_notes: string;
  kana_mastered: string;
  theme: string;
};

// Load all user data from Supabase
export async function loadCloudData(userId: string): Promise<UserData | null> {
  const { data } = await supabase
    .from('user_data')
    .select('progress, bookmarks, notes, schedule_notes, kana_mastered, theme')
    .eq('user_id', userId)
    .single();
  return data;
}

// Save specific field to Supabase
export async function saveCloudField(userId: string, field: string, value: unknown): Promise<void> {
  await supabase
    .from('user_data')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}

// Sync localStorage to cloud (initial upload)
export async function syncLocalToCloud(userId: string): Promise<void> {
  const progress = localStorage.getItem('nihongo_progress') || '{}';
  const bookmarks = localStorage.getItem('nihongo_bookmarks') || '[]';
  const notes = localStorage.getItem('nihongo_notes') || '{}';
  const schedule_notes = localStorage.getItem('nihongo_schedule_notes') || '{}';
  const kana_mastered = localStorage.getItem('nihongo_kana_mastered') || '[]';
  const theme = localStorage.getItem('nihongo_theme') || 'light';

  await supabase
    .from('user_data')
    .upsert({
      user_id: userId,
      progress: JSON.parse(progress),
      bookmarks: JSON.parse(bookmarks),
      notes: JSON.parse(notes),
      schedule_notes: JSON.parse(schedule_notes),
      kana_mastered: JSON.parse(kana_mastered),
      theme,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

// Sync cloud to localStorage (download)
export async function syncCloudToLocal(userId: string): Promise<void> {
  const data = await loadCloudData(userId);
  if (!data) return;
  if (data.progress) localStorage.setItem('nihongo_progress', JSON.stringify(data.progress));
  if (data.bookmarks) localStorage.setItem('nihongo_bookmarks', JSON.stringify(data.bookmarks));
  if (data.notes) localStorage.setItem('nihongo_notes', JSON.stringify(data.notes));
  if (data.schedule_notes) localStorage.setItem('nihongo_schedule_notes', JSON.stringify(data.schedule_notes));
  if (data.kana_mastered) localStorage.setItem('nihongo_kana_mastered', JSON.stringify(data.kana_mastered));
  if (data.theme) localStorage.setItem('nihongo_theme', data.theme);
}

// Auto-save helper: call after any localStorage write
export function autoSave(userId: string | null, field: string, localKey: string): void {
  if (!userId) return;
  const value = localStorage.getItem(localKey);
  if (value) {
    try {
      saveCloudField(userId, field, JSON.parse(value));
    } catch {
      saveCloudField(userId, field, value);
    }
  }
}
