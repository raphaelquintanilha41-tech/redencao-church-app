import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAllPlans, fetchMyPlanProgress } from '../lib/plans';
import type { ReadingPlan, UserPlanProgress } from '../lib/types';

export function PlanosScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [progressByPlan, setProgressByPlan] = useState<Map<string, UserPlanProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    Promise.all([fetchAllPlans(), fetchMyPlanProgress(user.id)])
      .then(([p, progress]) => {
        if (!mounted) return;
        setPlans(p);
        setProgressByPlan(progress);
      })
      .catch((err) => console.error('[PlanosScreen] falha ao carregar planos:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/')}>
          ← Início
        </button>
        <h1 className="igreja-title">Planos de leitura</h1>
      </header>
      <p className="static-body-text">
        Trilhas de leitura guiada, dia a dia, para conhecer a vida de Jesus ou aprofundar um tema específico da sua
        caminhada com Deus.
      </p>
      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : plans.length === 0 ? (
        <div className="caminhada-empty-state">
          <p className="static-body-text">Nenhum plano de leitura disponível no momento.</p>
        </div>
      ) : (
        plans.map((plan) => {
          const progress = progressByPlan.get(plan.id);
          const started = !!progress && progress.current_day > 0;
          const completed = !!progress && progress.current_day >= plan.total_days;
          const pct = progress ? Math.min(100, Math.round((progress.current_day / plan.total_days) * 100)) : 0;
          return (
            <section key={plan.id} className="card caminhada-cell-card">
              <div className="home-plan-title">{plan.title}</div>
              {plan.description && <p className="static-body-text">{plan.description}</p>}
              <div className="home-event-meta">{plan.total_days} dias</div>
              {started && (
                <>
                  <div className="home-progress-track">
                    <div className="home-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="home-event-meta">
                    {completed ? 'Concluído ✓' : `Dia ${progress!.current_day} de ${plan.total_days}`}
                  </div>
                </>
              )}
              <button type="button" className="btn-primary agenda-cta" onClick={() => navigate(`/planos/${plan.id}`)}>
                {completed ? 'Rever plano' : started ? 'Continuar' : 'Começar plano'}
              </button>
            </section>
          );
        })
      )}
    </div>
  );
}
