import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMinistries, fetchMyMinistryInterests, registerMinistryInterest, type Ministry } from '../lib/caminhada';
export function QueroServirScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ministries, setMinistries] = useState<Ministry[]>([]);
    const [interested, setInterested] = useState<Set<string>>(new Set());
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
          Promise.all([fetchMinistries(), fetchMyMinistryInterests(user.id)])
            .then(([m, i]) => {
                      if (!mounted) return;
                      setMinistries(m);
                      setInterested(i);
            })
            .catch((err) => console.error('[QueroServir] falha ao carregar:', err))
            .finally(() => mounted && setLoading(false));
          return () => {
                  mounted = false;
          };
    }, [user]);
    const registrar = async (ministryId: string) => {
          if (!user) return;
          setBusyId(ministryId);
          try {
                  await registerMinistryInterest(user.id, ministryId);
                  setInterested((prev) => new Set(prev).add(ministryId));
                  showToast('Interesse enviado.');
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
                        <h1 className="igreja-title">Quero servir</h1>h1>
                </header>header>
            {loading ? (
                    <p className="home-event-meta biblia-loading-msg">A carregar…</p>p>
                  ) : ministries.length === 0 ? (
                    <div className="caminhada-empty-state">
                              <p className="static-body-text">
                                          A lista de ministérios ainda não foi cadastrada. Assim que estiver disponível, aparece aqui.
                              </p>p>
                    </div>div>
                  ) : (
                    ministries.map((m) => (
                                <section key={m.id} className="card caminhada-cell-card">
                                            <div className="home-plan-title">{m.name}</div>div>
                                  {m.description && <p className="static-body-text">{m.description}</p>p>}
                                            <button
                                                            type="button"
                                                            className={interested.has(m.id) ? 'btn-secondary agenda-cta' : 'btn-primary agenda-cta'}
                                                            disabled={busyId === m.id || interested.has(m.id)}
                                                            onClick={() => registrar(m.id)}
                                                          >
                                              {interested.has(m.id) ? 'Interesse enviado ✓' : 'Tenho interesse'}
                                            </button>button>
                                </section>section>
                              ))
                  )}
            {toast && <div className="rc-toast">{toast}</div>div>}
          </div>div>
        );
}
</div>
