import { supabase } from './supabaseClient';
import { localDateKey } from './dates';

/**
 * Sequência de dias consecutivos (streak) com leitura da Bíblia ou devocional,
 * calculada a partir de dados reais:
 *  - user_daily_progress (marcações "Li a Bíblia" / "Fiz o devocional");
 *  - reading_history (capítulos abertos no leitor da Bíblia).
 *
 * O dia de hoje ainda está "em aberto": se hoje ainda não houve atividade, a
 * contagem começa em ontem — assim, à meia-noite a sequência não cai para 0
 * antes de a pessoa ter tido oportunidade de a manter.
 */
export async function fetchStreak(userId: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 400);

  const [progress, reading] = await Promise.all([
    supabase
      .from('user_daily_progress')
      .select('progress_date, read_bible, did_devotional')
      .eq('user_id', userId)
      .gte('progress_date', localDateKey(since))
      .order('progress_date', { ascending: false }),
    supabase
      .from('reading_history')
      .select('read_at')
      .eq('user_id', userId)
      .gte('read_at', since.toISOString())
      .order('read_at', { ascending: false })
      .limit(5000),
  ]);
  if (progress.error) throw progress.error;
  if (reading.error) throw reading.error;

  const activeDates = new Set<string>();
  for (const r of progress.data ?? []) {
    if (r.read_bible || r.did_devotional) activeDates.add(r.progress_date as string);
  }
  for (const r of reading.data ?? []) {
    if (r.read_at) activeDates.add(localDateKey(new Date(r.read_at as string)));
  }
  if (activeDates.size === 0) return 0;

  const cursor = new Date();
  if (!activeDates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (activeDates.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Total de eventos em que a pessoa se inscreveu (passados e futuros). */
export async function fetchRegisteredCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('event_registrations')
    .select('event_id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}
