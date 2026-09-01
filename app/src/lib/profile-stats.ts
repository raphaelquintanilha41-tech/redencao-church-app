import { supabase } from './supabaseClient';

/**
 * Sequência de dias consecutivos (streak) com pelo menos leitura da Bíblia
 * ou devocional feito, contando para trás a partir de hoje. Real, calculada
 * a partir de user_daily_progress — não é um número decorativo.
 */
export async function fetchStreak(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_daily_progress')
    .select('progress_date, read_bible, did_devotional')
    .eq('user_id', userId)
    .order('progress_date', { ascending: false })
    .limit(400);
  if (error) throw error;
  if (!data || data.length === 0) return 0;

  const activeDates = new Set(
    data.filter((r) => r.read_bible || r.did_devotional).map((r) => r.progress_date as string),
  );

  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (activeDates.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function fetchUpcomingRegisteredCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('event_registrations')
    .select('event_id, events!inner(event_date)', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('events.event_date', new Date().toISOString());
  if (error) throw error;
  return count ?? 0;
}
