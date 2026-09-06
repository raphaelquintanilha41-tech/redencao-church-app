import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGivingMethods, type GivingMethod } from '../lib/giving';

export function GenerosidadeScreen() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<GivingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchGivingMethods()
      .then((m) => mounted && setMethods(m))
      .catch((err) => console.error('[GenerosidadeScreen] falha ao carregar:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const copy = (label: string, value: string) => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => showToast(`${label} copiado.`))
      .catch(() => showToast('Não foi possível copiar.'));
  };

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
          ← Igreja
        </button>
        <h1 className="igreja-title">Generosidade</h1>
      </header>

      {loading ? (
        <p className="home-event-meta biblia-loading-msg">A carregar…</p>
      ) : methods.length === 0 ? (
        <section className="card static-payment-card">
          <div className="home-event-meta">Ainda não há formas de contribuição configuradas.</div>
        </section>
      ) : (
        methods.map((m) => (
          <section key={m.id} className="card static-payment-card">
            <span className="home-verse-kicker">{m.label}</span>
            {m.qr_image_url && (
              <img src={m.qr_image_url} alt={`QR Code — ${m.label}`} className="static-qr-image" />
            )}
            {m.value && <div className="static-payment-value">{m.value}</div>}
            {m.note && <p className="static-body-text">{m.note}</p>}
            {m.value && (
              <button
                type="button"
                className="btn-secondary static-copy-btn"
                onClick={() => copy(m.label, m.value as string)}
              >
                Copiar
              </button>
            )}
          </section>
        ))
      )}

      <section className="card perfil-section">
        <h3 className="home-section-title">Por que contribuímos?</h3>
        <p className="static-body-text">
          Contribuímos porque reconhecemos que tudo o que temos vem de Deus. Dízimos e ofertas são uma expressão de
          gratidão, generosidade e compromisso com a obra do Senhor, contribuindo para que a igreja continue
          anunciando o Evangelho, cuidando de pessoas e servindo à comunidade. A Bíblia nos ensina a contribuir de
          forma voluntária e consciente, pois "Deus ama quem dá com alegria" (2 Coríntios 9:7).
        </p>
      </section>
      {toast && <div className="rc-toast">{toast}</div>}
    </div>
  );
}
