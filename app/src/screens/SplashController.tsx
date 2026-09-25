import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HOME_READY_EVENT, hideSplash, isHomeReady } from '../lib/splash';

// Máximo de espera pela Home antes de retirar o logo (rede lenta).
const HOME_WAIT_MAX_MS = 5000;

// Retira o ecrã de abertura (index.html) quando:
//  - a sessão foi verificada e o destino não é a Home → logo de imediato;
//  - o destino é a Home → quando os dados da Home chegarem (ou 5 s).
export function SplashController() {
  const { session, loading } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session || pathname !== '/' || isHomeReady()) {
      hideSplash();
      return;
    }
    const onReady = () => hideSplash();
    window.addEventListener(HOME_READY_EVENT, onReady);
    const timer = window.setTimeout(hideSplash, HOME_WAIT_MAX_MS);
    return () => {
      window.removeEventListener(HOME_READY_EVENT, onReady);
      window.clearTimeout(timer);
    };
  }, [loading, session, pathname]);

  return null;
}
