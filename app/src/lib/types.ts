// Mirrors public.profiles from supabase/migrations/0001_phase1_foundation.sql.
export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

// Mirrors public.daily_verses / devotionals / events / sermons /
// reading_plans / user_daily_progress / user_plan_progress /
// prayer_requests from supabase/migrations (phase_home_schema).

export interface DailyVerse {
  id: string;
  reference: string;
  text: string;
  active_date: string;
}

export interface Devotional {
  id: string;
  title: string;
  summary: string;
  author: string | null;
  duration_minutes: number | null;
  image_url: string | null;
  published_at: string;
}

export interface ChurchEvent {
  id: string;
  title: string;
  event_date: string;
  location: string | null;
  category: string | null;
  image_url: string | null;
}

export interface Sermon {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  duration_seconds: number | null;
  series: string | null;
  published_at: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  total_days: number;
}

export interface UserPlanProgress {
  user_id: string;
  plan_id: string;
  current_day: number;
  updated_at: string;
}

export interface UserDailyProgress {
  user_id: string;
  progress_date: string;
  read_bible: boolean;
  did_devotional: boolean;
}

// Mirrors public.bible_books / bible_verses.
export interface BibleBook {
  id: number;
  abbrev: string;
  name: string;
  testament: 'VT' | 'NT';
  position: number;
  chapter_count: number;
}

export interface BibleVerse {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
}

// Mirrors public.favorites / bible_notes / reading_history (Fase 2 do
// handoff original: favoritos, notas e histórico de leitura por usuário).

export interface Favorite {
  user_id: string;
  verse_id: number;
  created_at: string;
}

export interface BibleNote {
  user_id: string;
  verse_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ReadingHistoryEntry {
  id: string;
  user_id: string;
  book_id: number;
  chapter: number;
  read_at: string;
}
