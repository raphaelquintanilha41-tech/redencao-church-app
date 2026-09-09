import { useNavigate } from 'react-router-dom';

const direitos = [
  'Aceder aos seus dados pessoais',
  'Corrigir dados incorretos ou desatualizados',
  'Solicitar a eliminação da sua conta e dos seus dados',
  'Pedir uma cópia dos seus dados (portabilidade)',
  'Opor-se a determinados tratamentos de dados',
];

export function PrivacidadeScreen() {
  const navigate = useNavigate();
  return (
    <div className="static-screen">
      <header className="igreja-header">
        <button type="button" className="biblia-back-btn" onClick={() => navigate('/perfil')}>
          ← Perfil
        </button>
        <h1 className="igreja-title">Privacidade</h1>
      </header>
      <section className="card-navy static-welcome-card">
        <p className="static-welcome-text">
          A Redenção Church respeita a sua privacidade e trata os seus dados pessoais em conformidade com o
          Regulamento Geral sobre a Proteção de Dados (RGPD). Esta página explica que dados recolhemos, para que
          servem e quais são os seus direitos.
        </p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Dados que recolhemos</h3>
        <p className="static-body-text">
          Nome, fotografia de perfil e e-mail associados à sua conta; pedidos de oração que envia (incluindo se
          marcados como anónimos ou confidenciais); inscrições em eventos e células; interesses em ministérios e
          discipulado; destaques, notas e progresso de leitura na Bíblia e nos planos devocionais; testemunhos
          partilhados.
        </p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Como usamos os seus dados</h3>
        <p className="static-body-text">
          Usamos os seus dados para lhe dar acesso à sua conta e ao seu histórico espiritual dentro da aplicação,
          para que a equipa pastoral possa acompanhar pedidos de oração, inscrições e pedidos de célula ou
          discipulado, e para lhe enviar as notificações que ativar (ex.: versículo do dia, lembretes de leitura).
          Pedidos de oração marcados como confidenciais são vistos apenas pela equipa pastoral responsável.
        </p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Partilha de dados</h3>
        <p className="static-body-text">
          Não vendemos nem partilhamos os seus dados com terceiros para fins de marketing. Os seus dados são
          armazenados junto de fornecedores técnicos que suportam a aplicação (alojamento de base de dados e
          alojamento da aplicação), sujeitos aos respetivos termos de proteção de dados.
        </p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Conservação de dados</h3>
        <p className="static-body-text">
          Mantemos os seus dados enquanto a sua conta estiver ativa. Pode solicitar a eliminação da sua conta e dos
          dados associados a qualquer momento.
        </p>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Os seus direitos</h3>
        <ul className="static-values-list">
          {direitos.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>
      <section className="card perfil-section">
        <h3 className="home-section-title">Como exercer os seus direitos</h3>
        <p className="static-body-text">
          Para exercer qualquer um destes direitos, contacte a liderança da igreja presencialmente ou através do
          Instagram @redencaochurchportugal.
        </p>
      </section>
    </div>
  );
}
