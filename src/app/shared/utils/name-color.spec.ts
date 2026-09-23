import { avatarColor, nameColor } from './name-color';

describe('nameColor', () => {
  it('es determinista para el mismo nombre', () => {
    expect(nameColor('Actas')).toEqual(nameColor('Actas'));
  });

  it('usa el primer color de la paleta para un nombre vacío o nulo', () => {
    const first = { bg: '#EBF3FB', fg: '#1E4F7A', dot: '#2E6DA4' };
    expect(nameColor('')).toEqual(first);
    expect(nameColor(null)).toEqual(first);
  });

  it('conserva la paleta de categorías y pills', () => {
    // Valores calculados con la implementación anterior (category-color.ts), para fijar que la
    // fusión no cambia ningún color.
    expect(nameColor('Actas')).toEqual({ bg: '#F3EAF8', fg: '#5B2779', dot: '#8E4FB8' });
    expect(nameColor('Informes')).toEqual({ bg: '#F4F6F8', fg: '#4A5A6E', dot: '#6B7A8D' });
  });

  it('devuelve la variante apagada cuando muted es true', () => {
    expect(nameColor('Actas', true)).toEqual({ bg: '#EEF1F4', fg: '#9AA8B8', dot: '#9AA8B8' });
  });
});

describe('avatarColor', () => {
  it('es determinista para el mismo nombre', () => {
    expect(avatarColor('Ana Pérez')).toEqual(avatarColor('Ana Pérez'));
  });

  it('usa el color base como texto y el mismo con transparencia como fondo', () => {
    const { bg, fg } = avatarColor('Ana Pérez');
    expect(bg).toBe(`${fg}22`);
  });

  it('conserva la paleta de avatares', () => {
    // Valores calculados con la implementación anterior (avatar-color.ts).
    expect(avatarColor('Ana Pérez')).toEqual({ bg: '#3A8A3F22', fg: '#3A8A3F' });
    expect(avatarColor('Luis Gómez')).toEqual({ bg: '#E8A02022', fg: '#E8A020' });
  });

  it('usa el primer color de su paleta para un nombre vacío', () => {
    expect(avatarColor('')).toEqual({ bg: '#2E6DA422', fg: '#2E6DA4' });
  });

  it('devuelve la variante apagada cuando muted es true', () => {
    expect(avatarColor('Ana Pérez', true)).toEqual({ bg: '#E5EAF0', fg: '#9AA8B8' });
  });
});
