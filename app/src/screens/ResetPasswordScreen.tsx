import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translateAuthError } from '../lib/authErrors';
import { supabase } from '../lib/supabaseClient';
const logo = '/redencao-logo.jpeg'; // servido de public/ — copie o ficheiro do zip original para app/public/

/**
* Landing page for the "Esqueceu-se da palavra-passe?" email link.
* Supabase's `detectSessionInUrl` picks up the recovery token from the URL
* fragment and fires a PASSWORD_RECOVERY auth event with a live session —
* updateUser({ password }) then works like any other authenticated call.
*/
export function ResetPasswordScreen() {
const { updatePassword } = useAuth();
const navigate = useNavigate();

const [ready, setReady] = useState(false);
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [error, setError] = useState<string | null>(null);
const [submitting, setSubmitting] = useState(false);
const [done, setDone] = useState(false);

useEffect(() => {
const { data: sub } = supabase.auth.onAuthStateChange((event) => {
if (event === 'PASSWORD_RECOVERY') setReady(true);
});
// Also cover the case where a session already exists by the time this
// screen mounts (event fired before the listener was attached).
supabase.auth.getSession().then(({ data }) => {
if (data.session) setReady(true);
});
return () => sub.subscription.unsubscribe();
}, []);

const handleSubmit = async (e: FormEvent) => {
e.preventDefault();
setError(null);
if (password.length < 6) {
setError('A palavra-passe deve ter pelo menos 6 caracteres.');
return;
}
if (password !== confirmPassword) {
setError('As palavras-passe não coincidem.');
return;
}
setSubmitting(true);
try {
await updatePassword(password);
setDone(true);
setTimeout(() => navigate('/', { replace: true }), 1500);
} catch (err) {
setError(translateAuthError(err instanceof Error ? err.message : String(err)));
} finally {
setSubmitting(false);
}
};

return (
<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
<div className="rc-app-header">
<img src={logo} alt="Redenção Church" />
<div>
<div className="rc-brand">Redenção Church</div>
<div className="rc-tagline">Palavra · Comunhão · Propósito</div>
</div>
</div>

<div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px 24px', gap: 20 }}>
<div>
<h2 style={{ fontSize: 24, marginBottom: 4 }}>Definir nova palavra-passe</h2>
<p className="rc-form-note">Escolha uma nova palavra-passe para a sua conta.</p>
</div>

{!ready && !done && (
<div className="rc-form-note">
A validar o link de recuperação… Se abriu esta página diretamente (sem vir do e-mail), peça um novo link
em "Esqueceu-se da palavra-passe?".
</div>
)}

{done ? (
<div className="card elev-sm" style={{ textAlign: 'center', gap: 6, padding: 20 }}>
<div className="card-body">Palavra-passe atualizada. A entrar…</div>
</div>
) : (
<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
<div className="field">
<label htmlFor="new-password">Nova palavra-passe</label>
<input
id="new-password"
className="input"
type="password"
placeholder="••••••••"
autoComplete="new-password"
value={password}
onChange={(e) => setPassword(e.target.value)}
disabled={!ready}
/>
</div>
<div className="field">
<label htmlFor="confirm-new-password">Confirmar nova palavra-passe</label>
<input
id="confirm-new-password"
className="input"
type="password"
placeholder="••••••••"
autoComplete="new-password"
value={confirmPassword}
onChange={(e) => setConfirmPassword(e.target.value)}
disabled={!ready}
/>
</div>

{error && <div className="rc-field-error">{error}</div>}

<button className="btn btn-primary btn-block" type="submit" disabled={!ready || submitting}>
{submitting ? 'A guardar…' : 'Guardar nova palavra-passe'}
</button>
</form>
)}
</div>
</div>
);
}
