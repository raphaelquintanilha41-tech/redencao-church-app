import { supabase } from './supabaseClient';

/**
 * Horários regulares dos cultos, derivados dos próximos eventos com
 * categoria "Culto" (mantidos pelo cron ensure_recurring_cultos). Evita
 * horários escritos à mão nos ecrãs "Sou novo aqui" e "Visite-nos".
 * Devolve linhas prontas a mostrar, ex.: "Quintas-feiras, 20h".
 */
export async function fetchServiceSchedule(): Promise<string[]> {
  const { data, error } = await supabase
    .from('events')
    .select('event_date')
    .eq('category', 'Culto')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(12);
  if (error) throw error;
  const WEEKDAYS = ['Domingos', 'Segundas-feiras', 'Terças-feiras', 'Quartas-feiras', 'Quintas-feiras', 'Sextas-feiras', 'Sábados'];
  const seen = new Map<string, { day: number; minutes: number }>();
  for (const row of (data ?? []) as { event_date: string }[]) {
    const d = new Date(row.event_date);
    const key = `${d.getDay()}-${d.getHours()}-${d.getMinutes()}`;
    if (!seen.has(key)) seen.set(key, { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() });
  }
  return [...seen.values()]
    .sort((a, b) => a.day - b.day || a.minutes - b.minutes)
    .map(({ day, minutes }) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${WEEKDAYS[day]}, ${h}h${m ? String(m).padStart(2, '0') : ''}`;
    });
}
