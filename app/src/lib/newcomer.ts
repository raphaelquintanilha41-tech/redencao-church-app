import { supabase } from './supabaseClient';

// ── Sou novo aqui ────────────────────────────────────────────────────

export interface NewcomerContactFields {
  nome: string;
  telefone: string;
  como_conheceu: string | null;
  mensagem: string;
  quer_visita: boolean;
}

export interface NewcomerContact extends NewcomerContactFields {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export async function submitNewcomerContact(userId: string, fields: NewcomerContactFields): Promise<void> {
  const { error } = await supabase.from('newcomer_contacts').insert({ user_id: userId, ...fields });
  if (error) throw error;
}

export async function fetchMyNewcomerContact(userId: string): Promise<NewcomerContact | null> {
  const { data, error } = await supabase
    .from('newcomer_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as NewcomerContact | null) ?? null;
}
