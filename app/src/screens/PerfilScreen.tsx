import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateOwnProfile, uploadAvatar } from '../lib/profiles';
import { fetchStreak, fetchUpcomingRegisteredCount } from '../lib/profile-stats';
import { fetchActiveReadingPlanProgress } from '../lib/home';
import { getThemePreference, setThemePreference, type ThemePreference } from '../lib/preferences';
import type { ReadingPlan, UserPlanProgress } from '../lib/types';

type InstallState = 'unknown' | 'installable' | 'installed' | 'unsupported';

export function PerfilScreen() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [plan, setPlan] = useState<{ plan: ReadingPlan; progress: UserPlanProgress } | null>(null);
  const [upcomingCount, setUpcomingCount] = useState<number | null>(null);
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installState, setInstallState] = useState<InstallState>('unknown');

  const firstName = (profile?.full_name ?? user?.email ?? '').split(' ')[0];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    Promise.all([fetchStreak(user.id), fetchActiveReadingPlanProgress(user.id), fetchUpcomingRegisteredCount(user.id)])
      .then(([s, p, c]) => {
        if (!mounted) return;
        setStreak(s);
        setPlan(p);
        setUpcomingCount(c);
      })
      .catch((err) => console.error('[PerfilScreen] falha ao carregar caminhada:', err));
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setInstallState('installed');
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setInstallState('installable');
    };
    window.addEventListener('beforeinstallprompt', handler);
    // Sem o evento (ex: iOS Safari, que não o suporta), avisamos como
    // "não suportado aqui" em vez de deixar o botão sem explicação.
    const timer = setTimeout(() => {
      setInstallState((s) => (s === 'unknown' ? 'unsupported' : s));
    }, 1500);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

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
      showToast('Foto de perfil atualizada.');
    } catch (err) {
      showToast(`Falha ao atualizar a foto: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const saveName = async () => {
    if (!user || !nameDraft.trim()) return;
    setSavingName(true);
    try {
      await updateOwnProfile(user.id, { full_name: nameDraft.trim() });
      await refreshProfile();
      setEditingName(false);
      showToast('Nome atualizado.');
    } catch (err) {
      showToast(`Falha ao salvar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingName(false);
    }
  };

  const changeTheme = (pref: ThemePreference) => {
    setTheme(pref);
    setThemePreference(pref);
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      showToast('Instalação não disponível neste navegador — use o menu "Adicionar à tela inicial".');
      return;
    }
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallState('installed');
      showToast('App instalado.');
    }
    setInstallPrompt(null);
  };

  const minhaAreaItems = [
    { label: 'Favoritos', route: '/favoritos' },
    { label: 'Notas', route: '/notas' },
    { label: 'Histórico', route: '/historico' },
    { label: 'Pedidos', route: null },
  ];

  return (
    <div className="perfil-screen">
      <h1 className="igreja-title">Perfil</h1>

      {/* Avatar + nome editável */}
      <section className="card perfil-header-card">
        <button
          onClick={handleAvatarClick}
          className="perfil-avatar-btn"
          aria-label="Alterar foto de perfil"
          disabled={uploading}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Foto de perfil" className="perfil-avatar" />
          ) : (
            <div className="perfil-avatar-placeholder">{(firstName?.[0] ?? '?').toUpperCase()}</div>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        <div className="perfil-header-info">
          {editingName ? (
            <div className="perfil-name-edit">
              <input
                className="perfil-name-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
              />
              <div className="perfil-name-edit-actions">
                <button type="button" className="btn-primary perfil-small-btn" disabled={savingName} onClick={saveName}>
                  Salvar
                </button>
                <button
                  type="button"
                  className="btn-secondary perfil-small-btn"
                  onClick={() => {
                    setNameDraft(profile?.full_name ?? '');
                    setEditingName(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card-title">{profile?.full_name ?? '—'}</div>
              <div className="home-event-meta">{profile?.email ?? user?.email}</div>
              <div className="perfil-header-actions">
                <button className="perfil-link-btn" onClick={handleAvatarClick} disabled={uploading}>
                  {uploading ? 'A carregar…' : 'Alterar foto'}
                </button>
                <button
                  className="perfil-link-btn"
                  onClick={() => {
                    setNameDraft(profile?.full_name ?? '');
                    setEditingName(true);
                  }}
                >
                  Editar nome
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Minha área */}
      <section className="card perfil-section">
        <h3 className="home-section-title">Minha área</h3>
        <div className="perfil-grid">
          {minhaAreaItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="perfil-grid-item"
              onClick={() => (item.route ? navigate(item.route) : showToast(`${item.label} chega numa próxima fase.`))}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Minha caminhada */}
      <section className="card perfil-section">
        <h3 className="home-section-title">Minha caminhada</h3>
        <div className="perfil-stats-row">
          <div className="perfil-stat">
            <div className="perfil-stat-number">{streak ?? '—'}</div>
            <div className="perfil-stat-label">dias seguidos</div>
          </div>
          <div className="perfil-stat">
            <div className="perfil-stat-number">
              {plan ? `${plan.progress.current_day}/${plan.plan.total_days}` : '—'}
            </div>
            <div className="perfil-stat-label">plano de leitura</div>
          </div>
          <div className="perfil-stat">
            <div className="perfil-stat-number">{upcomingCount ?? '—'}</div>
            <div className="perfil-stat-label">eventos inscritos</div>
          </div>
        </div>
      </section>

      {/* Configurações */}
      <section className="card perfil-section">
        <h3 className="home-section-title">Configurações</h3>
        <div className="perfil-config-row">
          <span>Aparência</span>
          <div className="perfil-segmented">
            {(['light', 'dark', 'system'] as ThemePreference[]).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`perfil-segment${theme === opt ? ' perfil-segment-active' : ''}`}
                onClick={() => changeTheme(opt)}
              >
                {opt === 'light' ? 'Claro' : opt === 'dark' ? 'Escuro' : 'Sistema'}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="perfil-config-row perfil-config-row-btn"
          onClick={() => showToast('Notificações chegam numa próxima fase (ainda não há envio push).')}
        >
          <span>Notificações</span>
          <ChevronIcon />
        </button>
        <button
          type="button"
          className="perfil-config-row perfil-config-row-btn"
          onClick={() => showToast('O tamanho da fonte da Bíblia já é salvo automaticamente ao ajustar A-/A+ na leitura.')}
        >
          <span>Bíblia</span>
          <ChevronIcon />
        </button>
        <button
          type="button"
          className="perfil-config-row perfil-config-row-btn"
          onClick={() => showToast('Privacidade chega numa próxima fase.')}
        >
          <span>Privacidade</span>
          <ChevronIcon />
        </button>
      </section>

      {/* Aplicação */}
      <section className="card perfil-section">
        <h3 className="home-section-title">Aplicação</h3>
        <div className="perfil-config-row">
          <span>Instalar aplicação</span>
          {installState === 'installed' ? (
            <span className="home-event-meta">Instalado ✓</span>
          ) : (
            <button type="button" className="btn-secondary perfil-small-btn" onClick={handleInstall}>
              Instalar
            </button>
          )}
        </div>
        <div className="perfil-config-row">
          <span>Atualizações</span>
          <span className="home-event-meta">Automáticas</span>
        </div>
      </section>

      {/* Conta */}
      <button className="btn-secondary perfil-signout-btn" onClick={() => signOut()}>
        Sair da conta
      </button>
      <button
        type="button"
        className="perfil-delete-account-btn"
        onClick={() =>
          showToast('Excluir conta exige uma etapa de servidor separada, ainda não configurada.')
        }
      >
        Excluir conta
      </button>

      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
