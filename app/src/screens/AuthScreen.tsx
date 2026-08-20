import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translateAuthError } from '../lib/authErrors';
const logo = '/redencao-logo.jpeg'; // servido de public/ — copie o ficheiro do zip original para app/public/

type Mode = 'login' | 'signup';

export function AuthScreen() {
const { signIn, signUp } = useAuth();
const navigate = useNavigate();

const [mode, setMode] = useState<Mode>('login');
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [error, setError] = useState<string | null>(null);
const [info, setInfo] = useState<string | null>(null);
const [submitting, setSubmitting] = useState(false);

const isSignup = mode === 'signup';
const heading = isSignup ? 'Criar conta' : 'Entrar';

const validate = (): string | null => {
if (isSignup && name.trim().length < 2) return 'Introduza o seu nome.';
if (!email.trim()) return 'Introduza o seu e-mail.';
if (password.length < 6) return 'A palavra-passe deve ter pelo menos 6 caracteres.';
if (isSignup && password !== confirmPassword) return 'As palavras-passe não coincidem.';
return null;
};

const handleSubmit = async (e: FormEvent) => {
e.preventDefault();
setError(null);
setInfo(null);

const validationError = validate();
if (validationError) {
setError(validationError);
return;
}

setSubmitting(true);
try {
if (isSignup) {
await signUp(name.trim(), email.trim(), password);
setInfo(
'Conta criada. Se a confirmação de e-mail estiver ativa no projeto Supabase, verifique a sua caixa de entrada antes de entrar.',
);
setMode('login');
} else {
await signIn(email.trim(), password);
navigate('/', { replace: true });
}
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

<form
onSubmit={handleSubmit}
style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px 24px', gap: 20 }}
>
<div>
<h2 style={{ fontSize: 24, marginBottom: 4 }}>{heading}</h2>
<p className="rc-form-note">Palavra, comunhão e propósito — num só lugar.</p>
</div>

<div className="seg" style={{ alignSelf: 'flex-start' }} role="tablist" aria-label="Entrar ou criar conta">
<label className="seg-opt">
<input
type="radio"
name="auth-mode"
checked={mode === 'login'}
onChange={() => {
setMode('login');
setError(null);
setInfo(null);
}}
/>
<span className="dot" />
Entrar
</label>
<label className="seg-opt">
<input
type="radio"
name="auth-mode"
checked={mode === 'signup'}
onChange={() => {
setMode('signup');
setError(null);
setInfo(null);
}}
/>
<span className="dot" />
Criar conta
</label>
</div>

<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
{isSignup && (
<div className="field">
<label htmlFor="name">Nome</label>
<input
id="name"
className="input"
type="text"
placeholder="O seu nome"
autoComplete="name"
value={name}
onChange={(e) => setName(e.target.value)}
/>
</div>
)}

<div className="field">
<label htmlFor="email">E-mail</label>
<input
id="email"
className="input"
type="email"
placeholder="voce@email.com"
autoComplete="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
/>
</div>

<div className="field">
<label htmlFor="password">Palavra-passe</label>
<input
id="password"
className="input"
type="password"
placeholder="••••••••"
autoComplete={isSignup ? 'new-password' : 'current-password'}
value={password}
onChange={(e) => setPassword(e.target.value)}
/>
</div>

{isSignup && (
<div className="field">
<label htmlFor="confirm-password">Confirmar palavra-passe</label>
<input
id="confirm-password"
className="input"
type="password"
placeholder="••••••••"
autoComplete="new-password"
value={confirmPassword}
onChange={(e) => setConfirmPassword(e.target.value)}
/>
</div>
)}

{!isSignup && (
<Link to="/forgot-password" className="rc-link-btn" style={{ alignSelf: 'flex-end' }}>
Esqueceu-se da palavra-passe?
</Link>
)}
</div>

{error && <div className="rc-field-error">{error}</div>}
{info && <div className="rc-form-note">{info}</div>}

<button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
{submitting ? 'A processar…' : heading}
</button>

<div
style={{
display: 'flex',
alignItems: 'center',
gap: 10,
color: 'var(--color-neutral-600)',
fontSize: 12,
}}
>
<div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
ou
<div style={{ flex: 1, height: 1, background: 'var(--color-divider)' }} />
</div>

<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
<button
className="btn btn-secondary btn-block"
type="button"
disabled
title="Em breve — login social ainda não implementado nesta fase."
>
Continuar com Google
</button>
<button
className="btn btn-secondary btn-block"
type="button"
disabled
title="Em breve — login social ainda não implementado nesta fase."
>
Continuar com Apple
</button>
</div>

<button
className="btn btn-ghost"
style={{ alignSelf: 'center' }}
type="button"
disabled
title="Em breve — navegação como visitante ainda não implementada nesta fase."
>
Continuar como visitante
</button>
</form>
</div>
);
}
