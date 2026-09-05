import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchDiscipleshipTracks,
  fetchMyDiscipleshipRequests,
  requestDiscipleshipTrack,
  type DiscipleshipTrack,
} from '../lib/caminhada';
export function DiscipuladoScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tracks, setTracks] = useState<DiscipleshipTrack[]>([]);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    Promise.all([fetchDiscipleshipTracks(), fetchMyDiscipleshipRequests(user.id)])
      .then(([t, r]) => {
        if (!mounted) return;
        setTracks(t);
        setRequested(r);
      })
      .catch((err) => console.error('[DiscipuladoScreen] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);
  const participar = async (trackId: string) => {
    if (!user) return;
    setBusyId(trackId);
    try {
      await requestDiscipleshipTrack(user.id, trackId);
      setRequested((prev) => new Set(prev).add(trackId));
      showToast('Solicitação enviada.');
    } catch (err) {
      showToast(`Falha ao enviar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusyId(null);
    }
  };
  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
          ← Igreja
        </button>
        <h1 className="igreja-title">Discipulado</h1>
      </header>
      <section className="card perfil-section">
        <p className="static-body-text">
          Discipulado é caminhar de perto com alguém mais experiente na fé, aprendendo a conhecer a Deus, a Palavra
          e a viver como igreja — passo a passo, com acompanhamento real (Mateus 28:19-20).
        </p>
      </section>
      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : tracks.length === 0 ? (
        <div className="caminhada-empty-state">
          <p className="static-body-text">
            As turmas de discipulado ainda não foram cadastradas nesta tela. Assim que a lista real (turma, líder,
            dia/horário) estiver disponível, ela aparece aqui.
          </p>
        </div>
      ) : (
        tracks.map((t) => (
          <section key={t.id} className="card caminhada-cell-card">
            <span className="agenda-card-category">Nível {t.level}</span>
            <div className="home-plan-title">{t.name}</div>
            {t.leader && <div className="home-event-meta">Líder: {t.leader}</div>}
            {t.day_time && <div className="home-event-meta">{t.day_time}</div>}
            {t.description && <p className="static-body-text">{t.description}</p>}
            <button
              type="button"
              className={requested.has(t.id) ? 'btn-secondary agenda-cta' : 'btn-primary agenda-cta'}
              disabled={busyId === t.id || requested.has(t.id)}
              onClick={() => participar(t.id)}
            >
              {requested.has(t.id) ? 'Solicitação enviada ✓' : 'Quero participar'}
            </button>
          </section>
        ))
      )}
      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}
