import { Document } from './document.model';

export type DocumentSortBy = 'createdAt' | 'title' | 'documentDate';
export type DocumentSortDir = 'asc' | 'desc';

export interface DocumentListParams {
  page: number;
  size: number;
  sortBy: DocumentSortBy;
  sortDir: DocumentSortDir;
  q?: string;
  categoryId?: number;
  responsibleArea?: string;
  dateFrom?: string;
  dateTo?: string;
  uploadedBy?: number;
}

export interface ActiveFiltersDto {
  categoryId: number | null;
  categoryName: string | null;
  responsibleArea: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  uploadedByName: string | null;
}

export interface DocumentListResponse {
  totalDocuments: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  documents: Document[];
  searchTerm: string | null;
  activeFilters: ActiveFiltersDto | null;
}

export interface DeleteDocumentResponse {
  id: number;
  message: string;
}
