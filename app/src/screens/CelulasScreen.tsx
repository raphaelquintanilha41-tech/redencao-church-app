import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchCellGroups, fetchMyCellRequests, requestCellGroup, type CellGroup } from '../lib/caminhada';
export function CelulasScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [groups, setGroups] = useState<CellGroup[]>([]);
    const [requested, setRequested] = useState<Set<string>>(new Set());
    const [category, setCategory] = useState('Todas');
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
          Promise.all([fetchCellGroups(), fetchMyCellRequests(user.id)])
            .then(([g, r]) => {
                      if (!mounted) return;
                      setGroups(g);
                      setRequested(r);
            })
            .catch((err) => console.error('[CelulasScreen] falha ao carregar:', err))
            .finally(() => mounted && setLoading(false));
          return () => {
                  mounted = false;
          };
    }, [user]);
    const categories = useMemo(() => ['Todas', ...new Set(groups.map((g) => g.category))], [groups]);
    const filtered = category === 'Todas' ? groups : groups.filter((g) => g.category === category);
    const participar = async (groupId: string) => {
          if (!user) return;
          setBusyId(groupId);
          try {
                  await requestCellGroup(user.id, groupId);
                  setRequested((prev) => new Set(prev).add(groupId));
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
                        </button>button>
                        <h1 className="igreja-title">Células</h1>h1>
                </header>header>
            {!loading && groups.length > 0 && (
                    <div className="biblia-tabs agenda-tabs">
                      {categories.map((c) => (
                                  <button
                                                  key={c}
                                                  type="button"
                                                  className={`biblia-tab${category === c ? ' biblia-tab-active' : ''}`}
                                                  onClick={() => setCategory(c)}
                                                >
                                    {c}
                                  </button>button>
                                ))}
                    </div>div>
                )}
            {loading ? (
                    <p className="home-event-meta biblia-loading-msg">A carregar…</p>p>
                  ) : groups.length === 0 ? (
                    <div className="caminhada-empty-state">
                              <p className="static-body-text">
                                          As células ainda não foram cadastradas nesta tela. Assim que a lista real (líder, dia/horário, região)
                                          estiver disponível, ela aparece aqui.
                              </p>p>
                    </div>div>
                  ) : (
                    filtered.map((g) => (
                                <section key={g.id} className="card caminhada-cell-card">
                                            <span className="agenda-card-category">{g.category}</span>span>
                                            <div className="home-plan-title">{g.name}</div>div>
                                            <div className="home-event-meta">Líder: {g.leader}</div>div>
                                            <div className="home-event-meta">{g.day_time}</div>div>
                                            <div className="home-event-meta">{g.region}</div>div>
                                  {g.description && <p className="static-body-text">{g.description}</p>p>}
                                            <button
                                                            type="button"
                                                            className={requested.has(g.id) ? 'btn-secondary agenda-cta' : 'btn-primary agenda-cta'}
                                                            disabled={busyId === g.id || requested.has(g.id)}
                                                            onClick={() => participar(g.id)}
                                                          >
                                              {requested.has(g.id) ? 'Solicitação enviada ✓' : 'Quero participar'}
                                            </button>button>
                                </section>section>
                              ))
                  )}
            {toast && <div className="rc-toast">{toast}</div>div>}
          </div>div>
        );
}
</div>
