import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchApprovedTestimonies, submitTestimony, type Testimony } from '../lib/caminhada';
export function TestemunhosScreen() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [testimonies, setTestimonies] = useState<Testimony[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const showToast = (msg: string) => {
          setToast(msg);
          setTimeout(() => setToast(null), 2800);
    };
    useEffect(() => {
          let mounted = true;
          fetchApprovedTestimonies()
            .then((t) => mounted && setTestimonies(t))
            .catch((err) => console.error('[Testemunhos] falha ao carregar:', err))
            .finally(() => mounted && setLoading(false));
          return () => {
                  mounted = false;
          };
    }, []);
    const enviar = async () => {
          if (!user || !content.trim()) return;
          setSending(true);
          try {
                  await submitTestimony(user.id, content.trim());
                  setContent('');
                  setShowForm(false);
                  showToast('Testemunho enviado para aprovação.');
          } catch (err) {
                  showToast(`Falha ao enviar: ${err instanceof Error ? err.message : String(err)}`);
          } finally {
                  setSending(false);
          }
    };
    return (
          <div className="static-screen">
                <header className="igreja-header">
                        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
                                  ← Igreja
                        </button>button>
                        <h1 className="igreja-title">Testemunhos</h1>h1>
                </header>header>
            {!showForm && (
                    <button type="button" className="btn-primary agenda-cta" onClick={() => setShowForm(true)}>
                              Compartilhar meu testemunho
                    </button>button>
                )}
            {showForm && (
                    <section className="card perfil-section">
                              <h3 className="home-section-title">Seu testemunho</h3>h3>
                              <textarea
                                            className="caminhada-textarea"
                                            rows={5}
                                            placeholder="Conte o que Deus fez em sua vida…"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                          />
                              <p className="home-event-meta">Seu testemunho passa por aprovação antes de aparecer publicamente.</p>p>
                              <div className="perfil-name-edit-actions">
                                          <button type="button" className="btn-primary perfil-small-btn" disabled={!content.trim() || sending} onClick={enviar}>
                                            {sending ? 'A enviar…' : 'Enviar'}
                                          </button>button>
                                          <button type="button" className="btn-secondary perfil-small-btn" onClick={() => setShowForm(false)}>
                                                        Cancelar
                                          </button>button>
                              </div>div>
                    </section>section>
                )}
            {loading ? (
                    <p className="home-event-meta biblia-loading-msg">A carregar…</p>p>
                  ) : testimonies.length === 0 ? (
                    <div className="caminhada-empty-state">
                              <p className="static-body-text">Ainda não há testemunhos aprovados publicados. Seja o primeiro a compartilhar o seu.</p>p>
                    </div>div>
                  ) : (
                    testimonies.map((t) => (
                                <section key={t.id} className="card perfil-section">
                                            <p className="static-body-text">{t.content}</p>p>
                                </section>section>
                              ))
                  )}
            {toast && <div className="rc-toast">{toast}</div>div>}
          </div>div>
        );
}
</div>
