import { avatarColor, nameColor } from './name-color';

const v = (name: string) => `var(--color-${name})`;

describe('nameColor', () => {
  it('es determinista para el mismo nombre', () => {
    expect(nameColor('Actas')).toEqual(nameColor('Actas'));
  });

  it('usa el primer color de la paleta para un nombre vacío o nulo', () => {
    const first = { bg: v('primary-light'), fg: v('primary-dark'), dot: v('primary') };
    expect(nameColor('')).toEqual(first);
    expect(nameColor(null)).toEqual(first);
  });

  it('conserva la paleta de categorías y pills', () => {
    // Mismas posiciones que la implementación con hex (Fase 3): 'Actas' era #F3EAF8/#5B2779/#8E4FB8
    // e 'Informes' #F4F6F8/#4A5A6E/#6B7A8D, que son exactamente estos tokens.
    expect(nameColor('Actas')).toEqual({
      bg: v('purple-light'),
      fg: v('purple-text'),
      dot: v('purple'),
    });
    expect(nameColor('Informes')).toEqual({
      bg: v('bg-app'),
      fg: v('neutral'),
      dot: v('text-secondary'),
    });
  });

  it('devuelve la variante apagada cuando muted es true', () => {
    expect(nameColor('Actas', true)).toEqual({
      bg: v('neutral-light'),
      fg: v('text-muted'),
      dot: v('text-muted'),
    });
  });
});

describe('avatarColor', () => {
  const translucent = (color: string) => `color-mix(in srgb, ${color} 13%, transparent)`;

  it('es determinista para el mismo nombre', () => {
    expect(avatarColor('Ana Pérez')).toEqual(avatarColor('Ana Pérez'));
  });

  it('usa el color base como texto y el mismo, translúcido, como fondo', () => {
    const { bg, fg } = avatarColor('Ana Pérez');
    expect(bg).toBe(translucent(fg));
  });

  it('conserva la paleta de avatares', () => {
    // Mismas posiciones que la implementación con hex: #3A8A3F y #E8A020.
    expect(avatarColor('Ana Pérez').fg).toBe(v('success'));
    expect(avatarColor('Luis Gómez').fg).toBe(v('warning'));
  });

  it('usa el primer color de su paleta para un nombre vacío', () => {
    expect(avatarColor('')).toEqual({ bg: translucent(v('primary')), fg: v('primary') });
  });

  it('devuelve la variante apagada cuando muted es true', () => {
    expect(avatarColor('Ana Pérez', true)).toEqual({ bg: v('divider'), fg: v('text-muted') });
  });
});
