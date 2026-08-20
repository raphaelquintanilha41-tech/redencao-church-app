import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translateAuthError } from '../lib/authErrors';
const logo = '/redencao-logo.jpeg'; // servido de public/ — copie o ficheiro do zip original para app/public/

export function ForgotPasswordScreen() {
const { requestPasswordReset } = useAuth();
const [email, setEmail] = useState('');
const [error, setError] = useState<string | null>(null);
const [sent, setSent] = useState(false);
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e: FormEvent) => {
e.preventDefault();
setError(null);
if (!email.trim()) {
setError('Introduza o seu e-mail.');
return;
}
setSubmitting(true);
try {
await requestPasswordReset(email.trim());
setSent(true);
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
<h2 style={{ fontSize: 24, marginBottom: 4 }}>Recuperar palavra-passe</h2>
<p className="rc-form-note">
Introduza o e-mail da sua conta. Vamos enviar um link para definir uma nova palavra-passe.
</p>
</div>

{sent ? (
<div className="card elev-sm" style={{ textAlign: 'center', gap: 6, padding: 20 }}>
<div className="card-body">
Se existir uma conta com o e-mail <b>{email.trim()}</b>, enviámos um link de recuperação. Verifique a
sua caixa de entrada (e o spam).
</div>
</div>
) : (
<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

{error && <div className="rc-field-error">{error}</div>}

<button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
{submitting ? 'A enviar…' : 'Enviar link de recuperação'}
</button>
</form>
)}

<Link to="/auth" className="rc-link-btn" style={{ alignSelf: 'center' }}>
Voltar para entrar
</Link>
</div>
</div>
);
}
