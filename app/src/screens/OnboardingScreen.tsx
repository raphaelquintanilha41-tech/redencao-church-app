import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { markOnboardingSeen } from '../lib/onboarding';

const logo = '/redencao-logo.jpeg';

type Slide = {
  overline: string;
  title: string;
  subtitle: string;
};

const slides: Slide[] = [
  {
    overline: 'BEM-VINDO',
    title: 'Bem-vindo à\nRedenção Church',
    subtitle: 'Uma igreja para viver Cristo todos os dias.',
  },
  {
    overline: 'PALAVRA',
    title: 'A Palavra todos\nos dias com você',
    subtitle: 'Leia, medite e guarde versículos, devocionais e planos de leitura.',
  },
  {
    overline: 'COMUNHÃO',
    title: 'Comunhão que\nnão fica só no culto',
    subtitle: 'Encontre uma célula, sirva, batize-se e caminhe acompanhado.',
  },
  {
    overline: 'COMEÇAR',
    title: 'Pronto para\ncomeçar?',
    subtitle: 'Crie sua conta para salvar seu progresso, ou explore como visitante.',
  },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const slide = slides[index];

  const finish = () => {
    markOnboardingSeen();
    navigate('/auth', { replace: true });
  };

  const handleContinue = () => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
  };

  const handleSkip = () => {
    finish();
  };

  return (
    <div className="onboarding-screen">
      <button
        type="button"
        className="onboarding-skip"
        onClick={handleSkip}
        style={{ visibility: isLast ? 'hidden' : 'visible' }}
      >
        Pular
      </button>

      <div className="onboarding-content">
        <img src={logo} alt="Redenção Church" className="onboarding-logo" />
        <span className="onboarding-overline">{slide.overline}</span>
        <h1 className="onboarding-title">
          {slide.title.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i === 0 && <br />}
            </span>
          ))}
        </h1>
        <p className="onboarding-subtitle">{slide.subtitle}</p>
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-dots" role="tablist" aria-label="Progresso do onboarding">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot${i === index ? ' onboarding-dot-active' : ''}`}
            />
          ))}
        </div>

        {!isLast ? (
          <button type="button" className="btn-primary onboarding-cta" onClick={handleContinue}>
            Continuar
          </button>
        ) : (
          <div className="onboarding-final-actions">
            <button type="button" className="btn-primary onboarding-cta" onClick={finish}>
              Entrar ou criar conta
            </button>
            {/*
              Nota: "Continuar como visitante" ainda não tem uma experiência
              própria implementada (Home hoje exige login). Por ora leva para
              o mesmo /auth — trocar quando o modo visitante for construído.
            */}
            <button type="button" className="btn-secondary onboarding-cta" onClick={finish}>
              Continuar como visitante
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
