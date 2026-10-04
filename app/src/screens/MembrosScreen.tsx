import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchIsChurchAdmin,
  fetchMembers,
  membersToCsv,
  STATUS_LABEL,
  type Member,
  type MemberStatus,
} from '../lib/members';

type Filter = 'ativo' | 'visitante' | 'arquivado' | 'todos';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ativo', label: 'Ativos' },
  { key: 'visitante', label: 'Visitantes' },
  { key: 'arquivado', label: 'Arquivados' },
  { key: 'todos', label: 'Todos' },
];

/** Remove acentos para a pesquisa ("joao" encontra "João"). */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function MembrosScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ativo');
  const [query, setQuery] = useState('');
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    fetchIsChurchAdmin(user.id)
      .then(async (ok) => {
        if (!mounted) return;
        setIsAdmin(ok);
        if (ok) {
          const list = await fetchMembers();
          if (mounted) setMembers(list);
        }
      })
      .catch((err) => {
        console.error('[MembrosScreen] falha ao carregar:', err);
        if (mounted) setError('Não foi possível carregar o rol. Tente novamente.');
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const counts = useMemo(() => {
    const c: Record<MemberStatus, number> = { ativo: 0, visitante: 0, arquivado: 0 };
    for (const m of members ?? []) c[m.status] += 1;
    return c;
  }, [members]);

  const visible = useMemo(() => {
    const q = norm(query.trim());
    return (members ?? []).filter((m) => {
      if (filter !== 'todos' && m.status !== filter) return false;
      if (!q) return true;
      return norm(`${m.full_name} ${m.phone ?? ''} ${m.email ?? ''}`).includes(q);
    });
  }, [members, filter, query]);

  const exportar = async () => {
    if (!members || members.length === 0) return;
    const csv = membersToCsv(members);
    const name = `rol-membros-${new Date().toISOString().slice(0, 10)}.csv`;
    const file = new File([csv], name, { type: 'text/csv' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Rol de membros' });
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setExportMsg('Ficheiro descarregado. Abre no Excel.');
    setTimeout(() => setExportMsg(null), 3000);
  };

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/perfil')}>
          ← Perfil
        </button>
        <h1 className="igreja-title">Rol de membros</h1>
      </header>

      {error ? (
        <p className="caminhada-error">{error}</p>
      ) : isAdmin === null || (isAdmin && members === null) ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : !isAdmin ? (
        <section className="card perfil-section">
          <h3 className="home-section-title">Acesso restrito</h3>
          <p className="static-body-text">O rol de membros está disponível apenas para a liderança autorizada.</p>
        </section>
      ) : (
        <>
          <section className="card-navy membros-summary">
            <div className="membros-summary-item">
              <strong>{counts.ativo}</strong>
              <span>ativos</span>
            </div>
            <div className="membros-summary-item">
              <strong>{counts.visitante}</strong>
              <span>visitantes</span>
            </div>
            <div className="membros-summary-item">
              <strong>{counts.arquivado}</strong>
              <span>arquivados</span>
            </div>
          </section>

          <div className="membros-actions">
            <button type="button" className="btn-primary" onClick={() => navigate('/membros/novo')}>
              + Novo membro
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={exportar}
              disabled={!members || members.length === 0}
            >
              Exportar Excel
            </button>
          </div>
          {exportMsg && <p className="home-event-meta">{exportMsg}</p>}

          <input
            className="static-input"
            type="search"
            placeholder="Pesquisar por nome, telefone ou e-mail"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="caminhada-chip-row membros-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`biblia-tab caminhada-chip${filter === f.key ? ' biblia-tab-active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <section className="card perfil-section">
              <p className="static-body-text">
                {members && members.length === 0
                  ? 'Ainda não há membros cadastrados. Toque em "+ Novo membro" para começar.'
                  : 'Nenhum membro encontrado com este filtro.'}
              </p>
            </section>
          ) : (
            <section className="card membros-list">
              {visible.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="membros-row"
                  onClick={() => navigate(`/membros/${m.id}`)}
                >
                  <span className="membros-avatar">{(m.full_name[0] ?? '?').toUpperCase()}</span>
                  <span className="membros-row-main">
                    <span className="membros-row-name">{m.full_name}</span>
                    <span className="membros-row-meta">{m.phone || m.email || 'Sem contacto'}</span>
                  </span>
                  {filter === 'todos' && (
                    <span className={`membros-badge membros-badge-${m.status}`}>{STATUS_LABEL[m.status]}</span>
                  )}
                  <span className="membros-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
