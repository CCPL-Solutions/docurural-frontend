/**
 * Convierte una fecha `YYYY-MM-DD` en un `Date` a medianoche **local**. Es la inversa de
 * `formatYmd`. `new Date('YYYY-MM-DD')` la interpretaría en UTC y, en Colombia (UTC-5), daría el
 * día anterior (R11). Devuelve `null` si el valor está vacío o no es una fecha válida.
 */
export function parseYmd(ymd: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd ?? '');
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
