import { useNavigate } from 'react-router-dom';

const valores = ['Palavra de Deus', 'Oração', 'Unidade', 'Santidade', 'Honra', 'Serviço com excelência'];

const lideranca = [
  { nome: 'Bianca Donato', cargo: 'Pastora Presidente' },
  { nome: 'Raphael Quintanilha', cargo: 'Presbítero' },
  { nome: 'Robson Santos', cargo: 'Pastor auxiliar' },
  { nome: 'Andreza', cargo: 'Pastora auxiliar' },
];

export function SobreNosScreen() {
  const navigate = useNavigate();
  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/igreja')}>
          ← Igreja
        </button>
        <h1 className="igreja-title">Sobre nós</h1>
      </header>
      <section className="card-navy static-welcome-card">
        <p className="static-welcome-text">
          A Redenção Church é uma igreja cristã comprometida com a Palavra de Deus, a transformação de vidas e a
          formação de discípulos que vivam uma fé verdadeira, prática e rendida a Cristo.
        </p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Nossa história</h3>
        <p className="static-body-text">
          A Redenção Church nasceu em outubro de 2023, em Portugal, por meio da célula "Cavando Poços". O que começou
          como uma pequena reunião de oração e comunhão cresceu, alcançou vidas e tornou-se uma família espiritual.
          Em 25 de novembro de 2024, inaugurámos o nosso primeiro culto de portas abertas no formato de igreja, dando
          início a um novo tempo de expansão, cuidado e cumprimento do propósito de Deus.
        </p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Visão</h3>
        <p className="static-body-text">
          Ser uma igreja de vidas rendidas a Cristo, transformadas pela Palavra e comprometidas com o Reino de Deus.
        </p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Missão</h3>
        <p className="static-body-text">
          Alcançar vidas, formar discípulos e conduzir pessoas a uma caminhada de santidade, comunhão e serviço.
        </p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Valores</h3>
        <ul className="static-values-list">
          {valores.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Liderança</h3>
        {lideranca.map((l) => (
          <div key={l.nome} className="static-leader-row">
            <span className="home-event-title">{l.nome}</span>
            <span className="home-event-meta">{l.cargo}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
