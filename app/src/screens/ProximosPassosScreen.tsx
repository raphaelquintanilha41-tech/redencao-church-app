import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
type Step = {
    n: number;
    title: string;
    description: string;
    route?: string;
};
const steps: Step[] = [
  { n: 1, title: 'Sou novo aqui', description: 'Conheça a Redenção Church e o que esperar na sua primeira visita.', route: '/sou-novo-aqui' },
  { n: 2, title: 'Caminhando com Deus', description: 'Comece sua rotina diária de leitura e devocional.', route: '/caminhando-com-deus' },
  { n: 3, title: 'Células', description: 'Encontre um grupo pequeno para crescer em comunhão.', route: '/celulas' },
  { n: 4, title: 'Batismo', description: 'Dê o passo público da sua fé em Cristo.', route: '/batismo' },
  { n: 5, title: 'Quero servir', description: 'Descubra um ministério onde você pode contribuir.', route: '/quero-servir' },
  { n: 6, title: 'Discipulado', description: 'Aprofunde-se na fé com acompanhamento próximo.' },
  ];
export function ProximosPassosScreen() {
    const navigate = useNavigate();
    const [toast, setToast] = useState<string | null>(null);
    const handleClick = (step: Step) => {
          if (step.route) {
                  navigate(step.route);
          } else {
                  setToast(`${step.title} chega numa próxima fase.`);
                  setTimeout(() => setToast(null), 2500);
          }
    };
    return (
          <div className="static-screen">
                <header className="igreja-header">
                        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
                                  ← Igreja
                        </button>button>
                        <h1 className="igreja-title">Próximos passos</h1>h1>
                </header>header>
            {steps.map((step) => (
                    <section key={step.n} className="card caminhada-step-card">
                              <div className="caminhada-step-number">{step.n}</div>div>
                              <div className="caminhada-step-body">
                                          <div className="home-plan-title">{step.title}</div>div>
                                          <p className="static-body-text">{step.description}</p>p>
                              </div>div>
                              <button type="button" className="btn-secondary perfil-small-btn" onClick={() => handleClick(step)}>
                                          Conhecer
                              </button>button>
                    </section>section>
                  ))}
            {toast && <div className="rc-toast">{toast}</div>div>}
          </div>div>
        );
}
</div>
