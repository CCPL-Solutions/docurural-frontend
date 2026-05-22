export interface DocumentFilters {
  categoryId: number | null;
  responsibleArea: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  uploadedBy: number | null;
}

export const EMPTY_FILTERS: DocumentFilters = {
  categoryId: null,
  responsibleArea: null,
  dateFrom: null,
  dateTo: null,
  uploadedBy: null,
};

export function hasAnyFilter(filters: DocumentFilters): boolean {
  return Object.values(filters).some((v) => v !== null && v !== '');
}

export function countActiveFilters(filters: DocumentFilters): number {
  return Object.values(filters).filter((v) => v !== null && v !== '').length;
}

export type FilterChipKey = keyof DocumentFilters | 'q';

export interface FilterChipDescriptor {
  key: FilterChipKey;
  label: string;
  value: string;
  kind?: 'search' | 'filter';
}
