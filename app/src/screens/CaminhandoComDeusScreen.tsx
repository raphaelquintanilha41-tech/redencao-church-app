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
  const handleShare = async () => {
    if (!devotional) return;
    const shareText = `"${devotional.summary}"\n\n— ${devotional.title}\n\nRedenção Church`;
    try {
      if (navigator.share) {
        await navigator.share({ title: devotional.title, text: shareText });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        showToast('Devocional copiado para a área de transferência.');
      } else {
        showToast('Partilha não é suportada neste navegador.');
      }
    } catch (err) {
     if (err instanceof Error && err.name !== 'AbortError') {
        showToast('Não foi possível partilhar agora.');
      }
    }
  };
  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
          ← Igreja
        </button>
        <h1 className="igreja-title">Caminhando com Deus</h1>
      </header>
      <section className="card-navy caminhada-streak-card">
        <span className="home-verse-kicker">SEQUÊNCIA</span>
        <div className="caminhada-streak-number">{loading ? '—' : streak}</div>
        <div className="caminhada-streak-label">{streak === 1 ? 'dia seguido' : 'dias seguidos'}</div>
        <div className="caminhada-week-row">
          {week.map((d, i) => (
            <div key={d.date} className={`caminhada-day${d.active ? ' caminhada-day-active' : ''}`}>
              {WEEKDAY_LABELS[new Date(d.date + 'T12:00:00').getDay()] ?? WEEKDAY_LABELS[i % 7]}
            </div>
          ))}
        </div>
      </section>
      {devotional && (
        <section className="card perfil-section">
          <div className="home-devotional-card-header">
            <h3 className="home-section-title">Devocional de hoje</h3>
            <button
              type="button"
              className="home-devotional-card-share"
              aria-label="Partilhar devocional"
              onClick={handleShare}
            >
              <ShareIcon />
            </button>
          </div>
          <div className="home-plan-title">{devotional.title}</div>
          <p className="static-body-text">{devotional.summary}</p>
          {devotional.duration_minutes && (
            <div className="home-event-meta">{devotional.duration_minutes} min de leitura</div>
          )}
          {today?.did_devotional ? (
            <div className="caminhada-done-badge">Concluído hoje ✓</div>
          ) : (
            <button type="button" className="btn-primary agenda-cta" onClick={concluir}>
              Concluí meu devocional
            </button>
          )}
        </section>
      )}
      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 7.5L12 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
