import { NavLink } from 'react-router-dom';

/*
 * Ícones da barra inferior em estilo 3D brilhante.
 * Cada ícone é desenhado em formas preenchidas com:
 *  - corpo com gradiente metálico (prata-azulado inativo, dourado ativo);
 *  - camada de brilho (reflexo especular) por cima;
 *  - relevo/sombra via CSS (nav.css).
 * Os gradientes estão definidos uma única vez em <NavIconDefs/>.
 */

type IconShape = { d?: string; circle?: { cx: number; cy: number; r: number } };

const HOME: IconShape[] = [
  {
    d: 'M12 2.9 21.4 10.8a1 1 0 0 1-.65 1.77H19.5V20a1.1 1.1 0 0 1-1.1 1.1H14.6v-5.3a2.6 2.6 0 0 0-5.2 0v5.3H5.6A1.1 1.1 0 0 1 4.5 20v-7.43H3.25a1 1 0 0 1-.65-1.77Z',
  },
];
const BOOK: IconShape[] = [
  { d: 'M2.3 5.6c0-.9.7-1.6 1.6-1.6h5.5c1.5 0 2.7 1.2 2.7 2.7v13.7c0-1.1-.9-2.1-2.1-2.1H3.9a1.6 1.6 0 0 1-1.6-1.6Z' },
  { d: 'M21.7 5.6c0-.9-.7-1.6-1.6-1.6h-5.5c-1.5 0-2.7 1.2-2.7 2.7v13.7c0-1.1.9-2.1 2.1-2.1h6.1a1.6 1.6 0 0 0 1.6-1.6Z' },
];
const CHURCH: IconShape[] = [
  { d: 'M11 1.4h2a.5.5 0 0 1 .5.5v1.1h1.1a.5.5 0 0 1 .5.5v1.4a.5.5 0 0 1-.5.5h-1.1v1.8h-3V5.4H9.4a.5.5 0 0 1-.5-.5V3.5a.5.5 0 0 1 .5-.5h1.1V1.9a.5.5 0 0 1 .5-.5Z' },
  { d: 'M12 7.2 20.6 12.5V20a1.1 1.1 0 0 1-1.1 1.1h-4.9v-4.6a2.6 2.6 0 0 0-5.2 0v4.6H4.5A1.1 1.1 0 0 1 3.4 20v-7.5Z' },
];
const USER: IconShape[] = [
  { circle: { cx: 12, cy: 7.6, r: 4.3 } },
  { d: 'M3.9 20c.9-4 4.2-6.6 8.1-6.6s7.2 2.6 8.1 6.6a1.1 1.1 0 0 1-1.1 1.3H5a1.1 1.1 0 0 1-1.1-1.3Z' },
];

const tabs = [
  { to: '/', label: 'Início', shapes: HOME, end: true },
  { to: '/biblia', label: 'Bíblia', shapes: BOOK, end: false },
  { to: '/igreja', label: 'Igreja', shapes: CHURCH, end: false },
  { to: '/perfil', label: 'Perfil', shapes: USER, end: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <NavIconDefs />
      {tabs.map(({ to, label, shapes, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' bottom-nav-item-active' : ''}`}
        >
          <span className="bottom-nav-icon">
            <Icon3D shapes={shapes} />
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function renderShape(s: IconShape, className: string, key: string) {
  if (s.circle) return <circle key={key} className={className} cx={s.circle.cx} cy={s.circle.cy} r={s.circle.r} />;
  return <path key={key} className={className} d={s.d} />;
}

function Icon3D({ shapes }: { shapes: IconShape[] }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g className="nav3d-body">{shapes.map((s, i) => renderShape(s, 'nav3d-fill', `b${i}`))}</g>
      <g className="nav3d-gloss">{shapes.map((s, i) => renderShape(s, 'nav3d-shine', `g${i}`))}</g>
    </svg>
  );
}

/** Gradientes partilhados por todos os ícones (um único <defs> na página). */
function NavIconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="rcNavSilver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="nav3d-s0" />
          <stop offset="0.45" className="nav3d-s1" />
          <stop offset="0.8" className="nav3d-s2" />
          <stop offset="1" className="nav3d-s3" />
        </linearGradient>
        <linearGradient id="rcNavGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF1C9" />
          <stop offset="0.38" stopColor="#E9C57A" />
          <stop offset="0.75" stopColor="#B88A3B" />
          <stop offset="1" stopColor="#7A5A22" />
        </linearGradient>
        <linearGradient id="rcNavGloss" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.42" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
