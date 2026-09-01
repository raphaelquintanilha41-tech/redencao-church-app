import { useNavigate } from 'react-router-dom';

const ADDRESS = 'Beco do Caetaninho 9, Carnaxide, Oeiras - Lisboa';
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
const INSTAGRAM_HANDLE = 'redencaochurchportugal';
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

export function VisiteNosScreen() {
  const navigate = useNavigate();
  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
          ← Igreja
        </button>
        <h1 className="igreja-title">Visite-nos</h1>
      </header>
      <div className="static-map-placeholder">Mapa</div>
      <section className="card perfil-section">
        <h3 className="home-section-title">Endereço</h3>
        <p className="static-body-text">{ADDRESS}</p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Horários</h3>
        <div className="home-event-title">Quintas-feiras, 20h</div>
        <div className="home-event-title">Domingos, 10h</div>
      </section>
      <div className="static-actions-row">
        <a className="btn-primary static-action-link" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
          Como chegar
        </a>
      </div>
      <section className="card perfil-section">
        <h3 className="home-section-title">Redes sociais</h3>
        <p className="static-body-text">
          Instagram:{' '}
          <a className="rc-link-btn" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            @{INSTAGRAM_HANDLE}
          </a>
        </p>
        <p className="home-event-meta">YouTube: em breve.</p>
      </section>
    </div>
  );
}
