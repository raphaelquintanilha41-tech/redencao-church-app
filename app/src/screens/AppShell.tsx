import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
/** Envolve as telas autenticadas com a barra de navegação fixa no rodapé. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-shell-content">{children}</div>
      <BottomNav />
    </div>
  );
}
