import { formatYmd } from './format-ymd';
import { parseYmd } from './parse-date';

describe('parseYmd', () => {
  it('interpreta la fecha a medianoche local, sin desfase horario (R11)', () => {
    const date = parseYmd('2026-03-01');
    expect(date).toEqual(new Date(2026, 2, 1));
    expect(date?.getDate()).toBe(1);
  });

  it('es la inversa de formatYmd', () => {
    expect(formatYmd(parseYmd('2026-12-31')!)).toBe('2026-12-31');
  });

  it('devuelve null si el valor está vacío, es nulo o no es una fecha válida', () => {
    expect(parseYmd('')).toBeNull();
    expect(parseYmd(null)).toBeNull();
    expect(parseYmd('2026-02-30')).toBeNull();
    expect(parseYmd('01/03/2026')).toBeNull();
  });
});
