import { formatYmd } from './format-ymd';

describe('formatYmd', () => {
  it('formatea la fecha local como YYYY-MM-DD con ceros a la izquierda', () => {
    expect(formatYmd(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatYmd(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});
