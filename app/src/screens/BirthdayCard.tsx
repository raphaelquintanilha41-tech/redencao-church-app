import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateOwnProfile } from '../lib/profiles';

// Data de aniversário do próprio utilizador (dia e mês; ano opcional).
// Usada no Perfil (sempre visível) e no Início (só enquanto não estiver preenchida).
// Os parabéns automáticos são enviados pela função send_birthday_greetings (pg_cron).

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const HOME_DISMISS_KEY = 'rc_birthday_prompt_dismissed_at';
const HOME_DISMISS_DAYS = 14;

function daysInMonth(month: number, year: number | null): number {
  if (month === 2) {
    if (year == null) return 29;
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function formatBirthday(day: number, month: number, year: number | null): string {
  return `${day} de ${MESES[month - 1]}${year ? ` de ${year}` : ''}`;
}

function homeDismissed(): boolean {
  try {
    const raw = localStorage.getItem(HOME_DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < HOME_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function BirthdayCard({ variant }: { variant: 'home' | 'perfil' }) {
  const { user, profile, refreshProfile } = useAuth();
  const hasBirthday = profile?.birth_day != null && profile?.birth_month != null;

  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(homeDismissed);

  useEffect(() => {
    setDay(profile?.birth_day ? String(profile.birth_day) : '');
    setMonth(profile?.birth_month ? String(profile.birth_month) : '');
    setYear(profile?.birth_year ? String(profile.birth_year) : '');
  }, [profile?.birth_day, profile?.birth_month, profile?.birth_year]);

  if (!user || !profile || user.is_anonymous) return null;
  if (variant === 'home' && (hasBirthday || dismissed)) return null;

  const currentYear = new Date().getFullYear();
  const yearNum = year ? Number(year) : null;
  const monthNum = month ? Number(month) : null;
  const maxDay = monthNum ? daysInMonth(monthNum, yearNum) : 31;

  const save = async () => {
    const d = Number(day);
    const m = Number(month);
    if (!d || !m) {
      setMessage('Escolha o dia e o mês.');
      return;
    }
    if (d > daysInMonth(m, yearNum)) {
      setMessage('Essa data não existe. Confira o dia e o mês.');
      return;
    }
    if (yearNum != null && (yearNum < 1900 || yearNum > currentYear)) {
      setMessage('Confira o ano.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateOwnProfile(user.id, { birth_day: d, birth_month: m, birth_year: yearNum });
      await refreshProfile();
      setEditing(false);
      setMessage('Guardado! Vamos celebrar consigo no seu dia. 🎉');
    } catch (err) {
      console.error('[BirthdayCard] falha ao guardar:', err);
      setMessage('Não foi possível guardar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const dismiss = () => {
    try {
      localStorage.setItem(HOME_DISMISS_KEY, String(Date.now()));
    } catch {
      /* sem armazenamento: o cartão volta a aparecer na próxima visita */
    }
    setDismissed(true);
  };

  const form = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1.2fr', gap: 8, marginTop: 8 }}>
        <select
          className="static-input"
          aria-label="Dia"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        >
          <option value="">Dia</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="static-input"
          aria-label="Mês"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option value="">Mês</option>
          {MESES.map((nome, i) => (
            <option key={nome} value={i + 1}>
              {nome}
            </option>
          ))}
        </select>
        <select
          className="static-input"
          aria-label="Ano (opcional)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="">Ano</option>
          {Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" className="btn-primary" disabled={saving || !day || !month} onClick={save}>
          {saving ? 'A guardar…' : 'Guardar'}
        </button>
        {variant === 'home' ? (
          <button type="button" className="btn-secondary" onClick={dismiss}>
            Agora não
          </button>
        ) : (
          hasBirthday && (
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          )
        )}
      </div>
    </>
  );

  if (variant === 'home') {
    return (
      <section className="card home-section">
        <h3 className="home-section-title">Quando faz anos? 🎂</h3>
        <p className="home-event-meta">
          Indique o seu dia de aniversário e a igreja celebra consigo. O ano é opcional.
        </p>
        {form}
        {message && <p className="home-event-meta">{message}</p>}
      </section>
    );
  }

  return (
    <section className="card perfil-section" id="aniversario">
      <h3 className="home-section-title">Data de aniversário</h3>
      {hasBirthday && !editing ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span className="card-title">
            {formatBirthday(profile.birth_day!, profile.birth_month!, profile.birth_year)}
          </span>
          <button type="button" className="perfil-link-btn" onClick={() => setEditing(true)}>
            Alterar
          </button>
        </div>
      ) : (
        <>
          <p className="home-event-meta">
            Usamos esta data só para lhe enviar os parabéns e para o rol de membros da igreja. O ano é opcional.
          </p>
          {form}
        </>
      )}
      {message && <p className="home-event-meta">{message}</p>}
    </section>
  );
}
