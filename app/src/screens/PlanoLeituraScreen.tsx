import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchPlanById, fetchPlanDay, fetchPlanProgress, setPlanProgress } from '../lib/plans';
import type { ReadingPlan, ReadingPlanDay, UserPlanProgress } from '../lib/types';

export function PlanoLeituraScreen() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [progress, setProgress] = useState<UserPlanProgress | null>(null);
  const [day, setDay] = useState<ReadingPlanDay | null>(null);
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingDay, setLoadingDay] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Carrega o plano e o progresso do usuário, define em qual dia abrir.
  useEffect(() => {
    if (!user || !planId) return;
    let mounted = true;
    setLoadingPlan(true);
    Promise.all([fetchPlanById(planId), fetchPlanProgress(user.id, planId)])
      .then(([p, prog]) => {
        if (!mounted) return;
        setPlan(p);
        setProgress(prog);
        if (p) {
          const startDay = Math.max(1, Math.min(p.total_days, (prog?.current_day ?? 0) + 1));
          setDayNumber(startDay);
        }
      })
      .catch((err) => console.error('[PlanoLeituraScreen] falha ao carregar plano:', err))
      .finally(() => mounted && setLoadingPlan(false));
    return () => {
      mounted = false;
    };
  }, [user, planId]);

  // Carrega o conteúdo do dia selecionado.
  useEffect(() => {
    if (!planId || dayNumber == null) return;
    let mounted = true;
    setLoadingDay(true);
    fetchPlanDay(planId, dayNumber)
      .then((d) => mounted && setDay(d))
      .catch((err) => console.error('[PlanoLeituraScreen] falha ao carregar dia:', err))
      .finally(() => mounted && setLoadingDay(false));
    return () => {
      mounted = false;
    };
  }, [planId, dayNumber]);

  const goToDay = (n: number) => {
    if (!plan) return;
    setDayNumber(Math.max(1, Math.min(plan.total_days, n)));
  };

  const currentDayDone = !!progress && dayNumber != null && progress.current_day >= dayNumber;

  const handleComplete = async () => {
    if (!user || !planId || dayNumber == null) return;
    setSaving(true);
    try {
      const next = Math.max(progress?.current_day ?? 0, dayNumber);
      const updated = await setPlanProgress(user.id, planId, next);
      setProgress(updated);
      showToast('Dia marcado como concluído.');
    } catch (err) {
      showToast(`Falha ao guardar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingPlan) {
    return (
      <div className="static-screen">
        <header className="igreja-header">
          <button type="button" className="biblia-back-btn" onClick={() => navigate('/planos')}>
            ← Planos
          </button>
        </header>
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="static-screen">
        <header className="igreja-header">
          <button type="button" className="biblia-back-btn" onClick={() => navigate('/planos')}>
            ← Planos
          </button>
        </header>
        <div className="caminhada-empty-state">
          <p className="static-body-text">Este plano não foi encontrado.</p>
        </div>
      </div>
    );
  }

  const pct = dayNumber ? Math.min(100, Math.round(((progress?.current_day ?? 0) / plan.total_days) * 100)) : 0;

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/planos')}>
          ← Planos
        </button>
        <h1 className="igreja-title">{plan.title}</h1>
      </header>

      <div className="home-progress-track">
        <div className="home-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="plan-day-nav">
        <button
          type="button"
          className="btn-secondary plan-day-nav-btn"
          disabled={dayNumber == null || dayNumber <= 1}
          onClick={() => dayNumber != null && goToDay(dayNumber - 1)}
        >
          ← Dia anterior
        </button>
        <span className="home-event-meta">
          Dia {dayNumber} de {plan.total_days}
        </span>
        <button
          type="button"
          className="btn-secondary plan-day-nav-btn"
          disabled={dayNumber == null || dayNumber >= plan.total_days}
          onClick={() => dayNumber != null && goToDay(dayNumber + 1)}
        >
          Próximo dia →
        </button>
      </div>

      {loadingDay ? (
        <p className="home-event-meta biblia-loading-msg">A carregar o dia…</p>
      ) : !day ? (
        <div className="caminhada-empty-state">
          <p className="static-body-text">O conteúdo deste dia ainda não está disponível.</p>
        </div>
      ) : (
        <>
          <section className="card home-section">
            <h2 className="home-devotional-modal-title plan-day-title">{day.title}</h2>
            <div className="plan-day-verse-block">
              <span className="home-verse-kicker">{day.verse_reference}</span>
              <p>{day.verse_text}</p>
            </div>
            <div className="home-devotional-modal-body">
              {day.content
                .split(/\n{2,}/)
                .filter((p) => p.trim().length > 0)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph.trim()}</p>
                ))}
            </div>
            <div className="plan-day-prayer">
              <span className="plan-day-prayer-label">Oração</span>
              <p>{day.prayer}</p>
            </div>
            <button
              type="button"
              className="btn-primary home-verse-btn"
              disabled={saving}
              onClick={handleComplete}
            >
              {currentDayDone ? 'Concluído ✓' : 'Marcar dia como concluído'}
            </button>
          </section>
        </>
      )}
      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}
