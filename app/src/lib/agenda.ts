import { supabase } from './supabaseClient';
import type { ChurchEvent } from './types';

export async function fetchAllEvents(): Promise<ChurchEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
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
