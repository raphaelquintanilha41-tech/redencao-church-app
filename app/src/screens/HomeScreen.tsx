import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateOwnProfile, uploadAvatar } from '../lib/profiles';
const logo = '/redencao-logo.jpeg'; // servido de public/ — copie o ficheiro do zip original para app/public/

export function HomeScreen() {
const { user, profile, signOut, refreshProfile } = useAuth();
const fileInputRef = useRef<HTMLInputElement>(null);
const [uploading, setUploading] = useState(false);
const [toast, setToast] = useState<string | null>(null);

const firstName = (profile?.full_name ?? user?.email ?? '').split(' ')[0];

const handleAvatarClick = () => fileInputRef.current?.click();

const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
e.target.value = '';
if (!file || !user) return;

setUploading(true);
try {
const url = await uploadAvatar(user.id, file);
await updateOwnProfile(user.id, { avatar_url: url });
await refreshProfile();
setToast('Foto de perfil atualizada.');
} catch (err) {
setToast(`Falha ao atualizar a foto: ${err instanceof Error ? err.message : String(err)}`);
} finally {
setUploading(false);
setTimeout(() => setToast(null), 4000);
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

<div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px 24px', gap: 24 }}>
<div>
<h2 style={{ fontSize: 20, marginBottom: 4 }}>Olá, {firstName || 'membro'}</h2>
<p className="rc-form-note">Que a Palavra conduza o seu dia.</p>
</div>

<div className="card elev-sm" style={{ alignItems: 'center', flexDirection: 'row', gap: 16 }}>
<button
onClick={handleAvatarClick}
style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
aria-label="Alterar foto de perfil"
disabled={uploading}
>
{profile?.avatar_url ? (
<img src={profile.avatar_url} alt="Foto de perfil" className="rc-avatar" />
) : (
<div className="rc-avatar-placeholder">{(firstName?.[0] ?? '?').toUpperCase()}</div>
)}
</button>
<input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
<div style={{ flex: 1 }}>
<div className="card-title">{profile?.full_name ?? '—'}</div>
<div className="card-meta">{profile?.email ?? user?.email}</div>
<button className="btn btn-ghost" style={{ paddingInline: 0, marginTop: 4 }} onClick={handleAvatarClick}>
{uploading ? 'A carregar…' : 'Alterar foto'}
</button>
</div>
</div>

<div className="card" style={{ gap: 8 }}>
<div className="card-kicker">Fase 1 — Fundação</div>
<div className="card-body">
Autenticação real, perfil persistente e armazenamento de avatar estão em funcionamento. Favoritos,
notas, histórico de leitura, planos, pedidos de oração e o restante da app (Fases 2–7 do README) ainda
não foram implementados nesta sessão.
</div>
</div>

<button className="btn btn-secondary btn-block" onClick={() => signOut()}>
Sair
</button>
</div>

{toast && <div className="rc-toast">{toast}</div>}
</div>
);
}
