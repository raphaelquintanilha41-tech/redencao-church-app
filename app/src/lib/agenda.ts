import { supabase } from './supabaseClient';
import type { ChurchEvent } from './types';

/**
 * Eventos a partir do início do dia de hoje (hora local). Eventos passados
 * ficavam listados com o botão "Inscrever-me" ativo.
 */
export async function fetchAllEvents(): Promise<ChurchEvent[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', startOfToday.toISOString())
    .order('event_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChurchEvent[];
}

export async function fetchMyRegistrations(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: { event_id: string }) => r.event_id));
}

export async function registerForEvent(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('event_registrations')
    .insert({ user_id: userId, event_id: eventId });
  if (error) throw error;
}

export async function unregisterFromEvent(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);
  if (error) throw error;
}
