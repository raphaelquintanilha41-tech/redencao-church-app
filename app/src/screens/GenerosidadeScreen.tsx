import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const MBWAY = '910585515';

export function GenerosidadeScreen() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const copy = (label: string, value: string) => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => showToast(`${label} copiado.`))
      .catch(() => showToast('Não foi possível copiar.'));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
          ← Igreja
        </button>
        <h1 className="igreja-title">Generosidade</h1>
      </header>
      <section className="card static-payment-card">
        <span className="home-verse-kicker">MB WAY</span>
        <div className="static-payment-value">{MBWAY}</div>
        <button type="button" className="btn-secondary static-copy-btn" onClick={() => copy('MB WAY', MBWAY)}>
          Copiar
        </button>
      </section>
      <section className="card static-payment-card">
        <span className="home-verse-kicker">IBAN</span>
        <div className="home-event-meta">Em breve.</div>
      </section>
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
