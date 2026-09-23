import {
  clampToMin,
  compareSensitivity,
  getLevelIndex,
  isAtLeast,
} from './sensitivity-level.model';

describe('sensitivity-level', () => {
  it('ordena INTERNAL < RESTRICTED < CONFIDENTIAL', () => {
    expect(getLevelIndex('INTERNAL')).toBe(0);
    expect(getLevelIndex('RESTRICTED')).toBe(1);
    expect(getLevelIndex('CONFIDENTIAL')).toBe(2);
  });

  it('compareSensitivity retorna -1, 0 o 1', () => {
    expect(compareSensitivity('INTERNAL', 'RESTRICTED')).toBe(-1);
    expect(compareSensitivity('RESTRICTED', 'RESTRICTED')).toBe(0);
    expect(compareSensitivity('CONFIDENTIAL', 'INTERNAL')).toBe(1);
  });

  it('isAtLeast incluye el propio mínimo', () => {
    expect(isAtLeast('RESTRICTED', 'RESTRICTED')).toBe(true);
    expect(isAtLeast('INTERNAL', 'RESTRICTED')).toBe(false);
  });

  it('clampToMin sube al mínimo y respeta los valores superiores', () => {
    expect(clampToMin('INTERNAL', 'RESTRICTED')).toBe('RESTRICTED');
    expect(clampToMin('CONFIDENTIAL', 'RESTRICTED')).toBe('CONFIDENTIAL');
  });
});
