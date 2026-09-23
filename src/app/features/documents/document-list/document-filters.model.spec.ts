import { countActiveFilters, EMPTY_FILTERS, hasAnyFilter } from './document-filters.model';

describe('document-filters', () => {
  it('sin filtros aplicados', () => {
    expect(hasAnyFilter(EMPTY_FILTERS)).toBe(false);
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
  });

  it('cuenta los filtros con valor', () => {
    const filters = { ...EMPTY_FILTERS, categoryId: 3, dateFrom: '2026-01-01' };
    expect(hasAnyFilter(filters)).toBe(true);
    expect(countActiveFilters(filters)).toBe(2);
  });

  it('ignora las cadenas vacías', () => {
    const filters = { ...EMPTY_FILTERS, responsibleArea: '' };
    expect(hasAnyFilter(filters)).toBe(false);
    expect(countActiveFilters(filters)).toBe(0);
  });
});
