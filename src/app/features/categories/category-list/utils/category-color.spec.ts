import { categoryColor } from './category-color';

describe('categoryColor', () => {
  it('es determinista para el mismo nombre', () => {
    expect(categoryColor('Actas')).toEqual(categoryColor('Actas'));
  });

  it('usa el primer color de la paleta para un nombre vacío', () => {
    expect(categoryColor('')).toEqual({ bg: '#EBF3FB', fg: '#1E4F7A' });
  });

  it('devuelve la variante apagada cuando muted es true', () => {
    expect(categoryColor('Actas', true)).toEqual({ bg: '#EEF1F4', fg: '#9AA8B8' });
  });
});
