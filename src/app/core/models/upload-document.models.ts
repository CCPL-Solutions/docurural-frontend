import { DocumentFormat } from './document-format.model';
import { SensitivityLevel } from './sensitivity-level.model';

export type ResponsibleArea =
  | 'Rectoría'
  | 'Secretaría'
  | 'Coordinación académica'
  | 'Coordinación de convivencia'
  | 'Biotecnología'
  | 'Bienestar estudiantil'
  | 'Almacén';

export const RESPONSIBLE_AREAS: readonly ResponsibleArea[] = [
  'Rectoría',
  'Secretaría',
  'Coordinación académica',
  'Coordinación de convivencia',
  'Biotecnología',
  'Bienestar estudiantil',
  'Almacén',
];

export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png'] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_TITLE_LENGTH = 255;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_AREA_LENGTH = 100;

export interface UploadDocumentResponse {
  id: number;
  title: string;
  category: string;
  responsibleArea: string;
  documentDate: string;
  fileFormat: DocumentFormat;
  fileSizeBytes: number;
  originalFileName: string;
  createdAt: string;
  message: string;
  sensitivityLevel: SensitivityLevel;
}

export const MAX_BATCH_FILES = 5;

export interface BatchUploadItemResult {
  fileName: string;
  success: boolean;
  documentId: number | null;
  errorMessage: string | null;
}

export interface BatchUploadDocumentResponse {
  totalReceived: number;
  totalSuccessful: number;
  totalFailed: number;
  results: BatchUploadItemResult[];
}
