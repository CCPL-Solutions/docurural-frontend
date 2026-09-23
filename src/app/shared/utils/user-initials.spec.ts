import { userInitials } from './user-initials';

describe('userInitials', () => {
  it('toma la inicial de las dos primeras palabras en mayúsculas', () => {
    expect(userInitials('ana maría lópez')).toBe('AM');
  });

  it('tolera espacios repetidos y nombres de una palabra', () => {
    expect(userInitials('  Ana   Pérez ')).toBe('AP');
    expect(userInitials('Ana')).toBe('A');
  });

  it('retorna cadena vacía para un nombre vacío o nulo', () => {
    expect(userInitials('')).toBe('');
    expect(userInitials(null)).toBe('');
  });
});
