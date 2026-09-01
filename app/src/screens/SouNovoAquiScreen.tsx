import { useNavigate } from 'react-router-dom';

export function SouNovoAquiScreen() {
  const navigate = useNavigate();
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
      <section className="card perfil-section">
        <h3 className="home-section-title">Fale conosco</h3>
        <p className="static-body-text">Contato de dúvidas em breve por aqui.</p>
      </section>
    </div>
  );
}
