import { supabase } from './supabaseClient';
import type {
  ChurchEvent,
  DailyVerse,
  Devotional,
  ReadingPlan,
  Sermon,
  UserDailyProgress,
  UserPlanProgress,
} from './types';
export async function fetchDailyVerse(): Promise<DailyVerse | null> {
  const { data, error } = await supabase
    .from('daily_verses')
    .select('*')
    .lte('active_date', new Date().toISOString().slice(0, 10))
    .order('active_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as DailyVerse | null;
}
export async function fetchRecommendedDevotional(): Promise<Devotional | null> {
  const { data, error } = await supabase
    .from('devotionals')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Devotional | null;
}
export async function fetchNextService(): Promise<ChurchEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', 'Culto')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ChurchEvent | null;
}
export async function fetchUpcomingEvents(limit = 5): Promise<ChurchEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ChurchEvent[];
}
export async function fetchLatestSermon(): Promise<Sermon | null> {
  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Sermon | null;
}
export async function fetchActiveReadingPlanProgress(
  userId: string,
): Promise<{ plan: ReadingPlan; progress: UserPlanProgress } | null> {
  const { data: progressRows, error: progressError } = await supabase
    .from('user_plan_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (progressError) throw progressError;
  const progress = progressRows?.[0] as UserPlanProgress | undefined;
  if (progress) {
    const { data: plan, error: planError } = await supabase
      .from('reading_plans')
      .select('*')
      .eq('id', progress.plan_id)
      .single();
    if (planError) throw planError;
    return { plan: plan as ReadingPlan, progress };
  }
  // Sem progresso registado ainda: mostra o primeiro plano disponível,
  // com progresso 0, para o usuário poder começar.
  const { data: firstPlan, error: firstPlanError } = await supabase
    .from('reading_plans')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (firstPlanError) throw firstPlanError;
  if (!firstPlan) return null;
  return {
    plan: firstPlan as ReadingPlan,
    progress: { user_id: userId, plan_id: firstPlan.id, current_day: 0, updated_at: new Date().toISOString() },
  };
}
export async function fetchTodayProgress(userId: string): Promise<UserDailyProgress | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('user_daily_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('progress_date', today)
    .maybeSingle();
  if (error) throw error;
  return data as UserDailyProgress | null;
}
export async function markTodayProgress(
  userId: string,
  patch: Partial<Pick<UserDailyProgress, 'read_bible' | 'did_devotional'>>,
): Promise<UserDailyProgress> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('user_daily_progress')
    .upsert(
      { user_id: userId, progress_date: today, ...patch },
      { onConflict: 'user_id,progress_date' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as UserDailyProgress;
}
