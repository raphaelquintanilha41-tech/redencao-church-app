import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMinistries } from '../lib/caminhada';
import {
  createMember,
  emptyMember,
  fetchIsChurchAdmin,
  fetchMember,
  memberToFields,
  MARITAL_LABEL,
  STATUS_LABEL,
  updateMember,
  type MaritalStatus,
  type Member,
  type MemberFields,
  type MemberStatus,
} from '../lib/members';

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="static-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function MembroFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'novo';
  const { user } = useAuth();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState<Member | null>(null);
  const [f, setF] = useState<MemberFields>(emptyMember());
  const [ministryOptions, setMinistryOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    (async () => {
      try {
        const ok = await fetchIsChurchAdmin(user.id);
        if (!mounted) return;
        setIsAdmin(ok);
        if (!ok) return;
        const [mins, member] = await Promise.all([
          fetchMinistries().catch(() => []),
          isNew ? Promise.resolve(null) : fetchMember(id!),
        ]);
        if (!mounted) return;
        setMinistryOptions(mins.map((m) => m.name));
        if (member) {
          setOriginal(member);
          setF(memberToFields(member));
        } else if (!isNew) {
          setError('Membro não encontrado.');
        }
      } catch (err) {
        console.error('[MembroFormScreen] falha ao carregar:', err);
        if (mounted) setError('Não foi possível carregar os dados.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id, id, isNew]);

  const set = <K extends keyof MemberFields>(key: K, value: MemberFields[K]) => setF((prev) => ({ ...prev, [key]: value }));
  const text = (key: keyof MemberFields) => ((f[key] as string | null) ?? '');

  const selectedMinistries = new Set(
    (f.ministries ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const toggleMinistry = (name: string) => {
    const next = new Set(selectedMinistries);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    set('ministries', next.size ? Array.from(next).join(', ') : null);
  };

  const save = async (override?: Partial<MemberFields>) => {
    const fields = { ...f, ...override };
    if (!fields.full_name.trim()) {
      setError('O nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const created = await createMember(fields);
        navigate(`/membros/${created.id}`, { replace: true });
        return;
      }
      const updated = await updateMember(id!, fields);
      setOriginal(updated);
      setF((prev) => ({ ...prev, ...override }));
      setSavedMsg('Alterações guardadas.');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      console.error('[MembroFormScreen] falha ao gravar:', err);
      setError('Não foi possível guardar. Verifique a ligação e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    await save({ status: 'arquivado', archive_reason: f.archive_reason });
    setArchiving(false);
  };

  const reactivate = () => save({ status: 'ativo', archive_reason: null });

  const isArchived = original?.status === 'arquivado';
  const statusOptions: MemberStatus[] = ['ativo', 'visitante'];

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/membros')}>
          ← Rol de membros
        </button>
        <h1 className="igreja-title">{isNew ? 'Novo membro' : f.full_name || 'Membro'}</h1>
      </header>

      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : !isAdmin ? (
        <section className="card perfil-section">
          <h3 className="home-section-title">Acesso restrito</h3>
          <p className="static-body-text">O rol de membros está disponível apenas para a liderança autorizada.</p>
        </section>
      ) : !isNew && !original ? (
        <p className="caminhada-error">{error ?? 'Membro não encontrado.'}</p>
      ) : (
        <>
          {isArchived && (
            <section className="card perfil-section membros-archived-card">
              <h3 className="home-section-title">Arquivado em {formatDate(original?.archived_at ?? null)}</h3>
              {original?.archive_reason && <p className="static-body-text">Motivo: {original.archive_reason}</p>}
              <button type="button" className="btn-secondary" disabled={saving} onClick={reactivate}>
                Reativar membro
              </button>
            </section>
          )}

          <section className="card perfil-section">
            <h3 className="home-section-title">Dados pessoais</h3>
            <Field label="Nome completo *" htmlFor="m-nome">
              <input id="m-nome" className="static-input" value={text('full_name')} onChange={(e) => set('full_name', e.target.value)} />
            </Field>
            <Field label="Telefone / WhatsApp" htmlFor="m-tel">
              <input id="m-tel" className="static-input" type="tel" value={text('phone')} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="E-mail" htmlFor="m-email">
              <input id="m-email" className="static-input" type="email" value={text('email')} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Data de nascimento" htmlFor="m-nasc">
              <input id="m-nasc" className="static-input" type="date" value={text('birth_date')} onChange={(e) => set('birth_date', e.target.value)} />
            </Field>
            <Field label="Morada / localidade" htmlFor="m-morada">
              <input id="m-morada" className="static-input" value={text('address')} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Estado civil" htmlFor="m-civil">
              <select
                id="m-civil"
                className="static-input"
                value={f.marital_status ?? ''}
                onChange={(e) => set('marital_status', (e.target.value || null) as MaritalStatus | null)}
              >
                <option value="">—</option>
                {(Object.keys(MARITAL_LABEL) as MaritalStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {MARITAL_LABEL[k]}
                  </option>
                ))}
              </select>
            </Field>
            {(f.marital_status === 'casado' || f.marital_status === 'uniao_facto') && (
              <Field label="Cônjuge" htmlFor="m-conjuge">
                <input id="m-conjuge" className="static-input" value={text('spouse_name')} onChange={(e) => set('spouse_name', e.target.value)} />
              </Field>
            )}
          </section>

          <section className="card perfil-section">
            <h3 className="home-section-title">Vida na igreja</h3>
            {!isArchived && (
              <>
                <h3 className="home-section-title static-field-title membros-label">Situação</h3>
                <div className="caminhada-chip-row">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`biblia-tab caminhada-chip${f.status === s ? ' biblia-tab-active' : ''}`}
                      onClick={() => set('status', s)}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </>
            )}
            <Field label="Data de entrada na igreja" htmlFor="m-entrada">
              <input id="m-entrada" className="static-input" type="date" value={text('joined_at')} onChange={(e) => set('joined_at', e.target.value)} />
            </Field>
            <label className="perfil-config-row caminhada-toggle-row">
              <span>Batizado(a)</span>
              <input type="checkbox" checked={f.baptized} onChange={(e) => set('baptized', e.target.checked)} />
            </label>
            {f.baptized && (
              <Field label="Data do batismo" htmlFor="m-batismo">
                <input id="m-batismo" className="static-input" type="date" value={text('baptism_date')} onChange={(e) => set('baptism_date', e.target.value)} />
              </Field>
            )}
            {ministryOptions.length > 0 && (
              <>
                <h3 className="home-section-title static-field-title membros-label">Ministérios</h3>
                <div className="caminhada-chip-row">
                  {ministryOptions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={`biblia-tab caminhada-chip${selectedMinistries.has(name) ? ' biblia-tab-active' : ''}`}
                      onClick={() => toggleMinistry(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="card perfil-section">
            <h3 className="home-section-title">Pastoral e RGPD</h3>
            <Field label="Consentimento para guardar os dados (data)" htmlFor="m-consent">
              <input id="m-consent" className="static-input" type="date" value={text('consent_at')} onChange={(e) => set('consent_at', e.target.value)} />
            </Field>
            <Field label="Observações pastorais" htmlFor="m-notas">
              <textarea id="m-notas" className="caminhada-textarea" rows={4} value={text('notes')} onChange={(e) => set('notes', e.target.value)} />
            </Field>
            <p className="home-event-meta caminhada-disclaimer">
              Estes dados são visíveis apenas para a liderança autorizada.
            </p>
          </section>

          {error && <p className="caminhada-error">{error}</p>}
          {savedMsg && <p className="home-event-meta membros-saved">{savedMsg}</p>}

          <button type="button" className="btn-primary agenda-cta" disabled={saving || !f.full_name.trim()} onClick={() => save()}>
            {saving ? 'A guardar…' : isNew ? 'Cadastrar membro' : 'Guardar alterações'}
          </button>

          {!isNew && !isArchived && (
            <section className="card perfil-section membros-archive-box">
              {!archiving ? (
                <button type="button" className="perfil-delete-account-btn" onClick={() => setArchiving(true)}>
                  Arquivar membro
                </button>
              ) : (
                <>
                  <h3 className="home-section-title">Arquivar {f.full_name}?</h3>
                  <p className="static-body-text">
                    A ficha não é apagada: fica guardada em "Arquivados" e pode ser reativada a qualquer momento.
                  </p>
                  <Field label="Motivo (opcional)" htmlFor="m-motivo">
                    <input
                      id="m-motivo"
                      className="static-input"
                      placeholder="Ex.: mudou de cidade, transferido, faleceu…"
                      value={text('archive_reason')}
                      onChange={(e) => set('archive_reason', e.target.value)}
                    />
                  </Field>
                  <div className="membros-actions">
                    <button type="button" className="btn-secondary" onClick={() => setArchiving(false)}>
                      Cancelar
                    </button>
                    <button type="button" className="btn-primary" disabled={saving} onClick={archive}>
                      Confirmar arquivo
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
