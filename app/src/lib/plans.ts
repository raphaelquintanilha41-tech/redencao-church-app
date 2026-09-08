import { supabase } from './supabaseClient';
import type { ReadingPlan, ReadingPlanDay, UserPlanProgress } from './types';

export async function fetchAllPlans(): Promise<ReadingPlan[]> {
  const { data, error } = await supabase
    .from('reading_plans')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReadingPlan[];
}

export async function fetchPlanById(planId: string): Promise<ReadingPlan | null> {
  const { data, error } = await supabase.from('reading_plans').select('*').eq('id', planId).maybeSingle();
  if (error) throw error;
  return data as ReadingPlan | null;
}

export async function fetchPlanDay(planId: string, dayNumber: number): Promise<ReadingPlanDay | null> {
  const { data, error } = await supabase
    .from('reading_plan_days')
    .select('*')
    .eq('plan_id', planId)
    .eq('day_number', dayNumber)
    .maybeSingle();
  if (error) throw error;
  return data as ReadingPlanDay | null;
}

export async function fetchMyPlanProgress(userId: string): Promise<Map<string, UserPlanProgress>> {
  const { data, error } = await supabase.from('user_plan_progress').select('*').eq('user_id', userId);
  if (error) throw error;
  const map = new Map<string, UserPlanProgress>();
  (data ?? []).forEach((row) => {
    const progress = row as UserPlanProgress;
    map.set(progress.plan_id, progress);
  });
  return map;
}

export async function fetchPlanProgress(userId: string, planId: string): Promise<UserPlanProgress | null> {
  const { data, error } = await supabase
    .from('user_plan_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .maybeSingle();
  if (error) throw error;
  return data as UserPlanProgress | null;
}

/**
 * Marca `dayNumber` como o dia atual do plano para o usuário (upsert).
 * Usado tanto para "iniciar" um plano (primeira chamada) quanto para
 * avançar o progresso ao marcar um dia como concluído.
 */
export async function setPlanProgress(
  userId: string,
  planId: string,
  dayNumber: number,
): Promise<UserPlanProgress> {
  const { data, error } = await supabase
    .from('user_plan_progress')
    .upsert(
      { user_id: userId, plan_id: planId, current_day: dayNumber, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,plan_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as UserPlanProgress;
}
