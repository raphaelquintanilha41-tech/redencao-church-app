/**
 * Chave de data (YYYY-MM-DD) no fuso horário local do dispositivo.
 *
 * `toISOString().slice(0, 10)` devolve a data em UTC: em Portugal, no horário
 * de verão (UTC+1), entre as 23h e a meia-noite o "dia" já tinha mudado, o que
 * fazia o progresso diário, o streak e a Palavra do dia virarem uma hora antes.
 */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Início do dia de hoje (00:00 hora local) em ISO, para filtrar eventos.
 * Um evento de hoje continua visível como "próximo" até à meia-noite,
 * mesmo depois de a hora de início ter passado.
 */
export function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
