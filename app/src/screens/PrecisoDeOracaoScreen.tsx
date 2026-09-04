import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitPrayerRequest } from '../lib/caminhada';
const CATEGORIAS = ['Saúde', 'Família', 'Trabalho', 'Finanças', 'Espiritual', 'Outro'];
export function PrecisoDeOracaoScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [categoria, setCategoria] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [anonimo, setAnonimo] = useState(false);
    const [confidencial, setConfidencial] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submit = async () => {
          if (!user || !content.trim()) return;
          setSending(true);
          setError(null);
          try {
                  await submitPrayerRequest(user.id, {
                            category: categoria,
                            content: content.trim(),
                            is_anonymous: anonimo,
                            is_confidential: confidencial,
                  });
                  setSent(true);
          } catch (err) {
                  setError(err instanceof Error ? err.message : String(err));
          } finally {
                  setSending(false);
          }
    };
    if (sent) {
          return (
                  <div className="static-screen caminhada-confirm">
                          <div className="caminhada-confirm-icon">✓</div>div>
                          <h2 className="igreja-title">Pedido enviado</h2>h2>
                          <p className="static-body-text">
                                    Recebemos o seu pedido de oração. Nossa equipe vai orar por você — obrigado por confiar isso a nós.
                          </p>p>
                          <button type="button" className="btn-primary agenda-cta" onClick={() => navigate('/igreja')}>
                                    Voltar para Igreja
                          </button>button>
                  </div>div>
                );
    }
    return (
          <div className="static-screen">
                <header className="igreja-header">
                        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
                                  ← Igreja
                        </button>button>
                        <h1 className="igreja-title">Preciso de oração</h1>h1>
                </header>header>
                <section className="card perfil-section">
                        <h3 className="home-section-title">Categoria</h3>h3>
                        <div className="caminhada-chip-row">
                          {CATEGORIAS.map((c) => (
                        <button
                                        key={c}
                                        type="button"
                                        className={`biblia-tab caminhada-chip${categoria === c ? ' biblia-tab-active' : ''}`}
                                        onClick={() => setCategoria(c)}
                                      >
                          {c}
                        </button>button>
                      ))}
                        </div>div>
                </section>section>
                <section className="card perfil-section">
                        <h3 className="home-section-title">Seu pedido</h3>h3>
                        <textarea
                                    className="caminhada-textarea"
                                    rows={5}
                                    placeholder="Compartilhe o que está em seu coração…"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                  />
                </section>section>
                <section className="card perfil-section">
                        <label className="perfil-config-row caminhada-toggle-row">
                                  <span>Enviar anonimamente</span>span>
                                  <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
                        </label>label>
                        <label className="perfil-config-row caminhada-toggle-row">
                                  <span>Manter confidencial</span>span>
                                  <input type="checkbox" checked={confidencial} onChange={(e) => setConfidencial(e.target.checked)} />
                        </label>label>
                </section>section>
                <p className="home-event-meta caminhada-disclaimer">
                        Seu pedido é visto apenas pela equipe pastoral. "Confidencial" restringe ainda mais quem tem acesso.
                </p>p>
            {error && <p className="caminhada-error">{error}</p>p>}
                <button
                          type="button"
                          className="btn-primary agenda-cta"
                          disabled={!content.trim() || sending}
                          onClick={submit}
                        >
                  {sending ? 'A enviar…' : 'Enviar pedido'}
                </button>button>
          </div>div>
        );
}
</div>
