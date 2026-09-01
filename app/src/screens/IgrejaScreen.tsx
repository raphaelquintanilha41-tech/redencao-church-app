import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNextService } from '../lib/home';
import type { ChurchEvent } from '../lib/types';

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  );
}

type Group = {
  title: string;
  items: string[];
};

const groups: Group[] = [
  {
    title: 'Sua caminhada',
    items: ['Caminhando com Deus', 'Preciso de oração', 'Próximos passos', 'Discipulado'],
  },
  {
    title: 'Faça parte',
    items: ['Células', 'Quero servir', 'Batismo', 'Testemunhos'],
  },
  {
    title: 'Redenção Church',
    items: ['Agenda', 'Dízimos e ofertas', 'Sou novo aqui', 'Visite-nos', 'Sobre nós'],
  },
];

const ITEM_ROUTES: Record<string, string> = {
  Agenda: '/agenda',
};

export function IgrejaScreen() {
  const navigate = useNavigate();
  const [nextService, setNextService] = useState<ChurchEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchNextService()
      .then((s) => mounted && setNextService(s))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[IgrejaScreen] falha ao carregar próximo culto:', err);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const showToast = (item: string) => {
    setToast(`${item} chega numa próxima fase.`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="igreja-screen">
      <header className="igreja-header">
        <h1 className="igreja-title">Igreja</h1>
      </header>

      <section className="card-navy igreja-highlight">
        <span className="home-verse-kicker">PRÓXIMO CULTO</span>
        {loading ? (
          <p className="igreja-highlight-text">A carregar…</p>
        ) : nextService ? (
          <>
            <div className="igreja-highlight-title">{nextService.title}</div>
            <div className="igreja-highlight-meta">{formatEventDate(nextService.event_date)}</div>
            {nextService.location && <div className="igreja-highlight-meta">{nextService.location}</div>}
          </>
        ) : (
          <p className="igreja-highlight-text">Nenhum culto agendado no momento.</p>
        )}
      </section>

      {groups.map((group) => (
        <section key={group.title} className="card igreja-group">
          <h3 className="home-section-title">{group.title}</h3>
          {group.items.map((item) => (
            <button
              key={item}
              type="button"
              className="igreja-row"
              onClick={() => {
                const route = ITEM_ROUTES[item];
                if (route) navigate(route);
                else showToast(item);
              }}
            >
              <span>{item}</span>
              <ChevronIcon />
            </button>
          ))}
        </section>
      ))}

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
