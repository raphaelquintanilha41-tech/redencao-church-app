import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasSeenOnboarding } from '../lib/onboarding';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="rc-form-note">A carregar…</span>
      </div>
    );
  }
  if (!session) {
    const dest = window.location.pathname + window.location.search;
    if (dest !== '/' && !dest.startsWith('/auth') && !dest.startsWith('/onboarding')) {
      sessionStorage.setItem('rc_redirect_after_login', dest);
    }
    if (!hasSeenOnboarding()) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}
