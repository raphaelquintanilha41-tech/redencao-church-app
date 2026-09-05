import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PerfilScreen } from './screens/PerfilScreen';
import { IgrejaScreen } from './screens/IgrejaScreen';
import { AgendaScreen } from './screens/AgendaScreen';
import { GenerosidadeScreen } from './screens/GenerosidadeScreen';
import { SouNovoAquiScreen } from './screens/SouNovoAquiScreen';
import { VisiteNosScreen } from './screens/VisiteNosScreen';
import { SobreNosScreen } from './screens/SobreNosScreen';
import { CaminhandoComDeusScreen } from './screens/CaminhandoComDeusScreen';
import { PrecisoDeOracaoScreen } from './screens/PrecisoDeOracaoScreen';
import { ProximosPassosScreen } from './screens/ProximosPassosScreen';
import { DiscipuladoScreen } from './screens/DiscipuladoScreen';
import { CelulasScreen } from './screens/CelulasScreen';
import { QueroServirScreen } from './screens/QueroServirScreen';
import { BatismoScreen } from './screens/BatismoScreen';
import { TestemunhosScreen } from './screens/TestemunhosScreen';
import { BibliaIndiceScreen } from './screens/BibliaIndiceScreen';
import { BibliaLeituraScreen } from './screens/BibliaLeituraScreen';
import { AppShell } from './screens/AppShell';
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
                <AppShell>
                  <HomeScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PerfilScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/biblia"
            element={
              <ProtectedRoute>
                <AppShell>
                  <BibliaIndiceScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/biblia/:bookAbbrev/:chapter"
            element={
              <ProtectedRoute>
                <AppShell>
                  <BibliaLeituraScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/igreja"
            element={
              <ProtectedRoute>
                <AppShell>
                  <IgrejaScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <AppShell>
                  <AgendaScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/generosidade"
            element={
              <ProtectedRoute>
                <AppShell>
                  <GenerosidadeScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sou-novo-aqui"
            element={
              <ProtectedRoute>
                <AppShell>
                  <SouNovoAquiScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/visite-nos"
            element={
              <ProtectedRoute>
                <AppShell>
                  <VisiteNosScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sobre-nos"
            element={
              <ProtectedRoute>
                <AppShell>
                  <SobreNosScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/caminhando-com-deus"
            element={
              <ProtectedRoute>
                <AppShell>
                  <CaminhandoComDeusScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/preciso-de-oracao"
            element={
              <ProtectedRoute>
                <AppShell>
                  <PrecisoDeOracaoScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/proximos-passos"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ProximosPassosScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/discipulado"
            element={
              <ProtectedRoute>
                <AppShell>
                  <DiscipuladoScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/celulas"
            element={
              <ProtectedRoute>
                <AppShell>
                  <CelulasScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quero-servir"
            element={
              <ProtectedRoute>
                <AppShell>
                  <QueroServirScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/batismo"
            element={
              <ProtectedRoute>
                <AppShell>
                  <BatismoScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/testemunhos"
            element={
              <ProtectedRoute>
                <AppShell>
                  <TestemunhosScreen />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
