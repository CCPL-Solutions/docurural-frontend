import { avatarColor, avatarInitials } from './avatar-color';

describe('avatarColor', () => {
  it('es determinista para el mismo nombre', () => {
    expect(avatarColor('Ana Pérez')).toEqual(avatarColor('Ana Pérez'));
  });

  it('usa el color base como texto y el mismo con transparencia como fondo', () => {
    const { bg, fg } = avatarColor('Ana Pérez');
    expect(bg).toBe(`${fg}22`);
  });

  it('devuelve la variante apagada cuando muted es true', () => {
    expect(avatarColor('Ana Pérez', true)).toEqual({ bg: '#E5EAF0', fg: '#9AA8B8' });
  });
});

describe('avatarInitials', () => {
  it('toma la inicial de las dos primeras palabras en mayúsculas', () => {
    expect(avatarInitials('ana maría lópez')).toBe('AM');
  });

  it('tolera espacios repetidos y nombres de una palabra', () => {
    expect(avatarInitials('  Ana   Pérez ')).toBe('AP');
    expect(avatarInitials('Ana')).toBe('A');
  });

  it('retorna cadena vacía para un nombre vacío', () => {
    expect(avatarInitials('')).toBe('');
  });
});
