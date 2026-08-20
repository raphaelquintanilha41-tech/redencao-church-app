import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Never put the service_role key here — the anon key is the only key that
// belongs in client code; it is safe to expose because every table it can
// touch is protected by Row Level Security (see supabase/migrations).
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
// eslint-disable-next-line no-console
console.error(
'[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas. ' +
'Copie .env.example para .env.local e preencha com os dados do seu projeto Supabase.',
);
}

// createClient() throws synchronously on an empty/invalid URL, which would
// crash the whole app at import time before anything can render a helpful
// message. Fall back to a syntactically valid placeholder so the UI still
// mounts — every auth/db call will simply fail (and surface an error) until
// real credentials are set in .env.local.
export const supabase = createClient(
supabaseUrl || 'https://placeholder.supabase.co',
supabaseAnonKey || 'placeholder-anon-key',
{
auth: {
persistSession: true,
autoRefreshToken: true,
detectSessionInUrl: true,
},
},
);
