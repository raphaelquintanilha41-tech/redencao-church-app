import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNextService } from '../lib/home';
import { fetchActiveMemberCount } from '../lib/members';
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
    items: ['Caminhando com Deus', 'Devocionais', 'Preciso de oração', 'Próximos passos', 'Discipulado'],
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
  'Dízimos e ofertas': '/generosidade',
  'Sou novo aqui': '/sou-novo-aqui',
  'Visite-nos': '/visite-nos',
  'Sobre nós': '/sobre-nos',
  'Caminhando com Deus': '/caminhando-com-deus',
  Devocionais: '/planos',
  'Preciso de oração': '/preciso-de-oracao',
  'Próximos passos': '/proximos-passos',
  Discipulado: '/discipulado',
  'Células': '/celulas',
  'Quero servir': '/quero-servir',
  Batismo: '/batismo',
  Testemunhos: '/testemunhos',
};
export function IgrejaScreen() {
  const navigate = useNavigate();
  const [nextService, setNextService] = useState<ChurchEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    fetchActiveMemberCount()
      .then((n) => mounted && setMemberCount(n))
      .catch((err) => console.error('[IgrejaScreen] falha ao contar membros:', err));
    return () => {
      mounted = false;
    };
  }, []);
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
      <header className="igreja-header igreja-header-row">
        <h1 className="igreja-title">Igreja</h1>
        {memberCount !== null && memberCount > 0 && (
          <div className="igreja-members-badge" role="img" aria-label={`Somos ${memberCount} membros`}>
            <span className="igreja-members-icon">
              <PeopleIcon />
            </span>
            <span className="igreja-members-text">
              <span className="igreja-members-label">Somos</span>
              <span className="igreja-members-number">{memberCount}</span>
            </span>
          </div>
        )}
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
function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 19.2c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6c0 .5-.4.8-.8.8H3.3c-.4 0-.8-.3-.8-.8Z" />
      <circle cx="17" cy="9" r="2.6" opacity=".75" />
      <path d="M16.6 13.4c2.9.2 4.9 2.3 4.9 5.2 0 .4-.3.7-.7.7h-3.9c.1-.3.1-.6.1-.9 0-1.9-.6-3.6-1.7-4.9.4-.1.8-.1 1.3-.1Z" opacity=".75" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
