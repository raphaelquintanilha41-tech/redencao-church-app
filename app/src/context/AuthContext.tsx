import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { fetchOwnProfile } from '../lib/profiles';
import type { Profile } from '../lib/types';

interface AuthContextValue {
session: Session | null;
user: User | null;
profile: Profile | null;
loading: boolean;
refreshProfile: () => Promise<void>;
signUp: (name: string, email: string, password: string) => Promise<void>;
signIn: (email: string, password: string) => Promise<void>;
signOut: () => Promise<void>;
requestPasswordReset: (email: string) => Promise<void>;
updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Where the "Esqueceu a palavra-passe?" email link sends the user back to,
// to land on /reset-password with a Supabase recovery session already set.
const PASSWORD_RESET_REDIRECT = `${window.location.origin}/reset-password`;

export function AuthProvider({ children }: { children: ReactNode }) {
const [session, setSession] = useState<Session | null>(null);
const [profile, setProfile] = useState<Profile | null>(null);
const [loading, setLoading] = useState(true);

const loadProfile = async (userId: string | undefined) => {
if (!userId) {
setProfile(null);
return;
}
try {
const p = await fetchOwnProfile(userId);
setProfile(p);
} catch (err) {
// A user should never fail to read their own profile row once RLS is
// correctly applied — surface this loudly instead of swallowing it.
// eslint-disable-next-line no-console
console.error('[AuthContext] falha ao carregar o próprio perfil:', err);
setProfile(null);
}
};

useEffect(() => {
let mounted = true;

supabase.auth.getSession().then(({ data }) => {
if (!mounted) return;
setSession(data.session);
loadProfile(data.session?.user.id).finally(() => setLoading(false));
});

const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
setSession(newSession);
loadProfile(newSession?.user.id);
});

return () => {
mounted = false;
sub.subscription.unsubscribe();
};
}, []);

const value = useMemo<AuthContextValue>(
() => ({
session,
user: session?.user ?? null,
profile,
loading,
refreshProfile: () => loadProfile(session?.user.id),
signUp: async (name, email, password) => {
const { error } = await supabase.auth.signUp({
email,
password,
options: {
// profiles.full_name is seeded from this by the
// handle_new_user() trigger — see migration 0001.
data: { full_name: name },
},
});
if (error) throw error;
},
signIn: async (email, password) => {
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;
},
signOut: async () => {
const { error } = await supabase.auth.signOut();
if (error) throw error;
},
requestPasswordReset: async (email) => {
const { error } = await supabase.auth.resetPasswordForEmail(email, {
redirectTo: PASSWORD_RESET_REDIRECT,
});
if (error) throw error;
},
updatePassword: async (newPassword) => {
const { error } = await supabase.auth.updateUser({ password: newPassword });
if (error) throw error;
},
}),
[session, profile, loading],
);

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
const ctx = useContext(AuthContext);
if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
return ctx;
}
