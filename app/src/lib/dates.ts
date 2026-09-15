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
