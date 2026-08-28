import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateOwnProfile, uploadAvatar } from '../lib/profiles';

/**
 * Versão mínima da tela Perfil (README item 11) — carrega o que já existia
 * na Home da Fase 1 (avatar, dados básicos, sair da conta). As seções "Minha
 * área", "Minha caminhada", "Configurações" e "Aplicação" do spec completo
 * ainda não foram construídas.
 */
export function PerfilScreen() {
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px 24px', gap: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 0 }}>Perfil</h2>

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
        <div className="card-kicker">Em construção</div>
        <div className="card-body">
          "Minha área" (favoritos, notas, histórico, pedidos), "Minha caminhada", "Configurações" e
          "Aplicação" ainda não foram implementadas.
        </div>
      </div>

      <button className="btn btn-secondary btn-block" onClick={() => signOut()}>
        Sair
      </button>

      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}
