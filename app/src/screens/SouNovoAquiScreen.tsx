import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyNewcomerContact, submitNewcomerContact, type NewcomerContact } from '../lib/newcomer';

const COMO_CONHECEU = ['Indicação de um amigo', 'Instagram', 'Google', 'Passando na rua', 'Outro'];

export function SouNovoAquiScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<NewcomerContact | null>(null);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [comoConheceu, setComoConheceu] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [querVisita, setQuerVisita] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    fetchMyNewcomerContact(user.id)
      .then((c) => mounted && setExisting(c))
      .catch((err) => console.error('[SouNovoAquiScreen] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  const submit = async () => {
    if (!user || !nome.trim() || !telefone.trim()) return;
    setSending(true);
    setError(null);
    try {
      await submitNewcomerContact(user.id, {
        nome: nome.trim(),
        telefone: telefone.trim(),
        como_conheceu: comoConheceu,
        mensagem: mensagem.trim(),
        quer_visita: querVisita,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const jaEnviado = sent || !!existing;

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
          ← Igreja
        </button>
        <h1 className="igreja-title">Sou novo aqui</h1>
      </header>

      <section className="card-navy static-welcome-card">
        <span className="home-verse-kicker">BEM-VINDO</span>
        <p className="static-welcome-text">
          Que bom ter você por perto! A Redenção Church é uma família aberta a todos — venha nos conhecer.
        </p>
      </section>

      <section className="card perfil-section">
        <h3 className="home-section-title">Horários dos cultos</h3>
        <div className="home-event-title">Quintas-feiras, 20h</div>
        <div className="home-event-title">Domingos, 10h</div>
      </section>

      <section className="card perfil-section">
        <h3 className="home-section-title">Para as crianças</h3>
        <p className="static-body-text">
          Temos uma sala das crianças disponível durante o culto, para que os pequenos também tenham seu espaço.
        </p>
      </section>

      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : jaEnviado ? (
        <section className="card perfil-section" style={{ textAlign: 'center', gap: 8 }}>
          <div className="caminhada-confirm-icon" style={{ margin: '0 auto' }}>
            ✓
          </div>
          <h3 className="home-section-title" style={{ marginTop: 8 }}>
            Recebemos o seu contato
          </h3>
          <p className="static-body-text">
            Obrigado por se apresentar! Alguém da nossa equipe vai entrar em contato em breve.
          </p>
        </section>
      ) : (
        <section className="card perfil-section">
          <h3 className="home-section-title">Fale conosco</h3>

          <div className="static-field">
            <label htmlFor="novo-nome">Nome</label>
            <input
              id="novo-nome"
              className="static-input"
              type="text"
              placeholder="O seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="static-field">
            <label htmlFor="novo-telefone">Telefone / WhatsApp</label>
            <input
              id="novo-telefone"
              className="static-input"
              type="tel"
              placeholder="9xx xxx xxx"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>

          <h3 className="home-section-title static-field-title">Como conheceu a Redenção Church?</h3>
          <div className="caminhada-chip-row">
            {COMO_CONHECEU.map((c) => (
              <button
                key={c}
                type="button"
                className={`biblia-tab caminhada-chip${comoConheceu === c ? ' biblia-tab-active' : ''}`}
                onClick={() => setComoConheceu(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <h3 className="home-section-title static-field-title">Mensagem (opcional)</h3>
          <textarea
            className="caminhada-textarea"
            rows={4}
            placeholder="Alguma dúvida ou algo que queira nos contar?"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />

          <label className="perfil-config-row caminhada-toggle-row static-field-title">
            <span>Gostaria de receber uma visita ou contato pessoal</span>
            <input type="checkbox" checked={querVisita} onChange={(e) => setQuerVisita(e.target.checked)} />
          </label>

          <p className="home-event-meta caminhada-disclaimer">
            Seus dados são vistos apenas pela equipe da igreja, para entrarmos em contato com você.
          </p>

          {error && <p className="caminhada-error">{error}</p>}

          <button
            type="button"
            className="btn-primary agenda-cta"
            disabled={!nome.trim() || !telefone.trim() || sending}
            onClick={submit}
          >
            {sending ? 'A enviar…' : 'Enviar contato'}
          </button>
        </section>
      )}
    </div>
  );
}
