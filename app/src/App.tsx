import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PerfilScreen } from './screens/PerfilScreen';
import { ProtectedRoute } from './screens/ProtectedRoute';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { isSupabaseConfigured } from './lib/supabaseClient';

function ConfigWarningBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div
      style={{
        background: '#3a2a1a',
        color: '#f0c98a',
        fontSize: 12,
        padding: '8px 16px',
        textAlign: 'center',
        lineHeight: 1.4,
      }}
    >
      Supabase não configurado — copie <code>.env.example</code> para <code>.env.local</code> e preencha com os
      dados do seu projeto. Sem isso, autenticação e persistência não funcionam.
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigWarningBanner />
        <Routes>
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomeScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PerfilScreen />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
