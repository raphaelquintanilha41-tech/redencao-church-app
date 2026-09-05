import { supabase } from './supabaseClient';
// ── Caminhando com Deus ──────────────────────────────────────────────
export interface DayProgress {
    date: string;
    active: boolean;
}
export async function fetchWeekProgress(userId: string): Promise<DayProgress[]> {
    const today = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          days.push(d.toISOString().slice(0, 10));
    }
    const { data, error } = await supabase
      .from('user_daily_progress')
      .select('progress_date, read_bible, did_devotional')
      .eq('user_id', userId)
      .gte('progress_date', days[0]);
    if (error) throw error;
    const activeDates = new Set(
          (data ?? []).filter((r) => r.read_bible || r.did_devotional).map((r) => r.progress_date as string),
        );
    return days.map((date) => ({ date, active: activeDates.has(date) }));
}
// ── Células ──────────────────────────────────────────────────────────
export interface CellGroup {
    id: string;
    name: string;
    category: string;
    leader: string;
    day_time: string;
    region: string;
    description: string | null;
}
export async function fetchCellGroups(): Promise<CellGroup[]> {
    const { data, error } = await supabase.from('cell_groups').select('*').order('name');
    if (error) throw error;
    return (data ?? []) as CellGroup[];
}
export async function fetchMyCellRequests(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase.from('cell_requests').select('cell_group_id').eq('user_id', userId);
    if (error) throw error;
    return new Set((data ?? []).map((r: { cell_group_id: string }) => r.cell_group_id));
}
export async function requestCellGroup(userId: string, cellGroupId: string): Promise<void> {
    const { error } = await supabase.from('cell_requests').insert({ user_id: userId, cell_group_id: cellGroupId });
    if (error) throw error;
}
// ── Quero servir ─────────────────────────────────────────────────────
export interface Ministry {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
}
export async function fetchMinistries(): Promise<Ministry[]> {
    const { data, error } = await supabase.from('ministries').select('*').order('name');
    if (error) throw error;
    return (data ?? []) as Ministry[];
}
export async function fetchMyMinistryInterests(userId: string): Promise<Set<string>> {
    const { data, error } = await supabase.from('ministry_interests').select('ministry_id').eq('user_id', userId);
    if (error) throw error;
    return new Set((data ?? []).map((r: { ministry_id: string }) => r.ministry_id));
}
export async function registerMinistryInterest(userId: string, ministryId: string): Promise<void> {
    const { error } = await supabase.from('ministry_interests').insert({ user_id: userId, ministry_id: ministryId });
    if (error) throw error;
}
// ── Batismo ──────────────────────────────────────────────────────────
export async function fetchMyBaptismRequest(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('baptism_requests')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
}
export async function requestBaptism(userId: string): Promise<void> {
    const { error } = await supabase.from('baptism_requests').insert({ user_id: userId });
    if (error) throw error;
}
// ── Testemunhos ──────────────────────────────────────────────────────
export interface Testimony {
    id: string;
    user_id: string;
    content: string;
    status: string;
    created_at: string;
}
export async function fetchApprovedTestimonies(): Promise<Testimony[]> {
    const { data, error } = await supabase
      .from('testimonies')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Testimony[];
}
export async function submitTestimony(userId: string, content: string): Promise<void> {
    const { error } = await supabase.from('testimonies').insert({ user_id: userId, content });
    if (error) throw error;
}
// ── Pedidos de oração ────────────────────────────────────────────────
export async function submitPrayerRequest(
    userId: string,
    fields: { category: string | null; content: string; is_anonymous: boolean; is_confidential: boolean },
  ): Promise<void> {
    const { error } = await supabase.from('prayer_requests').insert({ user_id: userId, ...fields });
    if (error) throw error;
}
