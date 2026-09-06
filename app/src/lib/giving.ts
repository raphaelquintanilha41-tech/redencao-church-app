import { supabase } from './supabaseClient';

// ── Generosidade ──────────────────────────────────────────────────────

export interface GivingMethod {
  id: string;
  type: 'mbway' | 'iban' | 'qr' | 'other';
  label: string;
  value: string | null;
  qr_image_url: string | null;
  note: string | null;
  display_order: number;
  active: boolean;
}

export async function fetchGivingMethods(): Promise<GivingMethod[]> {
  const { data, error } = await supabase
    .from('giving_methods')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data as GivingMethod[]) ?? [];
}
