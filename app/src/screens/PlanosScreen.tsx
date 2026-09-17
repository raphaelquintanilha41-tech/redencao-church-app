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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

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

  const handleSharePlan = async (plan: ReadingPlan) => {
    const url = `${window.location.origin}/planos/${plan.id}`;
    const shareText = `${plan.title}\n\n${plan.description ?? ''}\n\n— Redenção Church`;
    try {
      if (navigator.share) {
        await navigator.share({ title: plan.title, text: shareText, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast('Ligação copiada para a área de transferência.');
      } else {
        showToast('Partilha não suportada neste navegador.');
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
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/')}>
          ← Início
        </button>
        <h1 className="igreja-title">Devocionais</h1>
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
            <section key={plan.id} className="card caminhada-cell-card planos-card">
              <div className="planos-card-head">
                {plan.image_url && (
                  <img className="planos-card-image" src={plan.image_url} alt="" aria-hidden="true" loading="lazy" />
                )}
                <div className="planos-card-text">
                  <div className="home-plan-title">{plan.title}</div>
                  <div className="home-event-meta">{plan.total_days} dias</div>
                </div>
                <button
                  type="button"
                  className="home-devotional-card-share"
                  aria-label={`Partilhar plano ${plan.title}`}
                  onClick={(e) => { e.stopPropagation(); void handleSharePlan(plan); }}
                >
                  <ShareIcon />
                </button>
              </div>
              {plan.description && <p className="static-body-text">{plan.description}</p>}
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
