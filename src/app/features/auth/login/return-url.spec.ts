import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('conserva una ruta interna con sus query params', () => {
    expect(safeReturnUrl('/documents?q=acta&page=2')).toBe('/documents?q=acta&page=2');
  });

  it('usa /dashboard si no hay returnUrl', () => {
    expect(safeReturnUrl(null)).toBe('/dashboard');
    expect(safeReturnUrl('')).toBe('/dashboard');
  });

  it('descarta URLs externas', () => {
    expect(safeReturnUrl('https://example.com')).toBe('/dashboard');
    expect(safeReturnUrl('//example.com')).toBe('/dashboard');
    expect(safeReturnUrl('/\\example.com')).toBe('/dashboard');
    expect(safeReturnUrl('documents')).toBe('/dashboard');
  });
});
