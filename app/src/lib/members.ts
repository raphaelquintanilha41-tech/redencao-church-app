import { supabase } from './supabaseClient';

// ── Rol de membros (acesso restrito: tabela church_admins + RLS) ─────

export type MemberStatus = 'ativo' | 'visitante' | 'arquivado';
export type MaritalStatus = 'solteiro' | 'casado' | 'uniao_facto' | 'divorciado' | 'viuvo';

export interface MemberFields {
  full_name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  address: string | null;
  marital_status: MaritalStatus | null;
  spouse_name: string | null;
  joined_at: string | null;
  baptized: boolean;
  baptism_date: string | null;
  ministries: string | null;
  status: MemberStatus;
  archive_reason: string | null;
  consent_at: string | null;
  notes: string | null;
}

export interface Member extends MemberFields {
  id: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABEL: Record<MemberStatus, string> = {
  ativo: 'Ativo',
  visitante: 'Visitante',
  arquivado: 'Arquivado',
};

export const MARITAL_LABEL: Record<MaritalStatus, string> = {
  solteiro: 'Solteiro(a)',
  casado: 'Casado(a)',
  uniao_facto: 'União de facto',
  divorciado: 'Divorciado(a)',
  viuvo: 'Viúvo(a)',
};

export function emptyMember(): MemberFields {
  return {
    full_name: '',
    phone: null,
    email: null,
    birth_date: null,
    address: null,
    marital_status: null,
    spouse_name: null,
    joined_at: null,
    baptized: false,
    baptism_date: null,
    ministries: null,
    status: 'ativo',
    archive_reason: null,
    consent_at: null,
    notes: null,
  };
}

/** Extrai só os campos editáveis de uma ficha. */
export function memberToFields(m: Member): MemberFields {
  const base = emptyMember();
  const out = { ...base } as Record<string, unknown>;
  for (const k of Object.keys(base)) out[k] = (m as unknown as Record<string, unknown>)[k] ?? (base as unknown as Record<string, unknown>)[k];
  return out as unknown as MemberFields;
}

/** true se o utilizador atual pode gerir o rol (só vê a própria linha em church_admins). */
export async function fetchIsChurchAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('church_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await supabase.from('members').select('*').order('full_name');
  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function fetchMember(id: string): Promise<Member | null> {
  const { data, error } = await supabase.from('members').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Member) ?? null;
}

/** Converte strings vazias em null antes de gravar. */
function clean(fields: MemberFields): MemberFields {
  const out = { ...fields } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === 'string') {
      const t = v.trim();
      out[k] = t === '' ? null : t;
    }
  }
  const f = out as unknown as MemberFields;
  f.full_name = fields.full_name.trim();
  if (!f.baptized) f.baptism_date = null;
  if (f.marital_status !== 'casado' && f.marital_status !== 'uniao_facto') f.spouse_name = null;
  if (f.status !== 'arquivado') f.archive_reason = null;
  return f;
}

export async function createMember(fields: MemberFields): Promise<Member> {
  const { data, error } = await supabase.from('members').insert(clean(fields)).select('*').single();
  if (error) throw error;
  return data as Member;
}

export async function updateMember(id: string, fields: MemberFields): Promise<Member> {
  const { data, error } = await supabase.from('members').update(clean(fields)).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Member;
}

// ── Exportação para Excel (CSV com ; e BOM, como o Excel PT espera) ──

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function membersToCsv(members: Member[]): string {
  const cols: [string, (m: Member) => unknown][] = [
    ['Nome', (m) => m.full_name],
    ['Situação', (m) => STATUS_LABEL[m.status]],
    ['Telefone', (m) => m.phone],
    ['E-mail', (m) => m.email],
    ['Data de nascimento', (m) => m.birth_date],
    ['Morada', (m) => m.address],
    ['Estado civil', (m) => (m.marital_status ? MARITAL_LABEL[m.marital_status] : '')],
    ['Cônjuge', (m) => m.spouse_name],
    ['Entrada na igreja', (m) => m.joined_at],
    ['Batizado', (m) => (m.baptized ? 'Sim' : 'Não')],
    ['Data do batismo', (m) => m.baptism_date],
    ['Ministérios', (m) => m.ministries],
    ['Consentimento RGPD', (m) => m.consent_at],
    ['Arquivado em', (m) => (m.archived_at ? m.archived_at.slice(0, 10) : '')],
    ['Motivo do arquivo', (m) => m.archive_reason],
    ['Observações', (m) => m.notes],
  ];
  const head = cols.map(([h]) => csvCell(h)).join(';');
  const rows = members.map((m) => cols.map(([, f]) => csvCell(f(m))).join(';'));
  return '\uFEFF' + [head, ...rows].join('\r\n');
}
