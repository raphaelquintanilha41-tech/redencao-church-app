import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchStreak } from '../lib/profile-stats';
import { fetchWeekProgress, type DayProgress } from '../lib/caminhada';
import { fetchRecommendedDevotional, fetchTodayProgress, markTodayProgress } from '../lib/home';
import type { Devotional, UserDailyProgress } from '../lib/types';
const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export function CaminhandoComDeusScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [streak, setStreak] = useState<number | null>(null);
    const [week, setWeek] = useState<DayProgress[]>([]);
    const [devotional, setDevotional] = useState<Devotional | null>(null);
    const [today, setToday] = useState<UserDailyProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const showToast = (msg: string) => {
          setToast(msg);
          setTimeout(() => setToast(null), 2500);
    };
    useEffect(() => {
          if (!user) return;
          let mounted = true;
          Promise.all([fetchStreak(user.id), fetchWeekProgress(user.id), fetchRecommendedDevotional(), fetchTodayProgress(user.id)])
            .then(([s, w, d, t]) => {
                      if (!mounted) return;
                      setStreak(s);
                      setWeek(w);
                      setDevotional(d);
                      setToday(t);
            })
            .catch((err) => console.error('[CaminhandoComDeus] falha ao carregar:', err))
            .finally(() => mounted && setLoading(false));
          return () => {
                  mounted = false;
          };
    }, [user]);
    const concluir = async () => {
          if (!user) return;
          try {
                  const updated = await markTodayProgress(user.id, { did_devotional: true });
                  setToday(updated);
                  const w = await fetchWeekProgress(user.id);
                  setWeek(w);
                  const s = await fetchStreak(user.id);
                  setStreak(s);
                  showToast('Devocional concluído.');
          } catch (err) {
                  showToast(`Falha ao salvar: ${err instanceof Error ? err.message : String(err)}`);
          }
    };
    return (
          <div className="static-screen">
                <header className="igreja-header">
                        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
                                  ← Igreja
                        </button>button>
                        <h1 className="igreja-title">Caminhando com Deus</h1>h1>
                </header>header>
                <section className="card-navy caminhada-streak-card">
                        <span className="home-verse-kicker">SEQUÊNCIA</span>span>
                        <div className="caminhada-streak-number">{loading ? '—' : streak}</div>div>
                        <div className="caminhada-streak-label">{streak === 1 ? 'dia seguido' : 'dias seguidos'}</div>div>
                        <div className="caminhada-week-row">
                          {week.map((d, i) => (
                        <div key={d.date} className={`caminhada-day${d.active ? ' caminhada-day-active' : ''}`}>
                          {WEEKDAY_LABELS[new Date(d.date + 'T12:00:00').getDay()] ?? WEEKDAY_LABELS[i % 7]}
                        </div>div>
                      ))}
                        </div>div>
                </section>section>
            {devotional && (
                    <section className="card perfil-section">
                              <h3 className="home-section-title">Devocional de hoje</h3>h3>
                              <div className="home-plan-title">{devotional.title}</div>div>
                              <p className="static-body-text">{devotional.summary}</p>p>
                      {devotional.duration_minutes && (
                                  <div className="home-event-meta">{devotional.duration_minutes} min de leitura</div>div>
                              )}
                      {today?.did_devotional ? (
                                  <div className="caminhada-done-badge">Concluído hoje ✓</div>div>
                                ) : (
                                  <button type="button" className="btn-primary agenda-cta" onClick={concluir}>
                                                Concluí meu devocional
                                  </button>button>
                              )}
                    </section>section>
                )}
            {toast && <div className="rc-toast">{toast}</div>div>}
          </div>div>
        );
}
</div>
