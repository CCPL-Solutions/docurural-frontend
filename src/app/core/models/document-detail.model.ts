import { DocumentFormat } from './document-format.model';
import { SensitivityLevel } from './sensitivity-level.model';

export interface CategoryRef {
  id: number;
  name: string;
}

export interface UploadedByRef {
  id: number;
  fullName: string;
}

export interface DocumentDetailResponse {
  id: number;
  title: string;
  description: string | null;
  category: CategoryRef;
  responsibleArea: string;
  documentDate: string;
  fileFormat: DocumentFormat;
  fileSizeBytes: number;
  originalFileName: string;
  uploadedBy: UploadedByRef;
  createdAt: string;
  sensitivityLevel: SensitivityLevel;
}

export function isPreviewableFormat(fmt: DocumentFormat): boolean {
  return fmt === 'PDF' || fmt === 'JPG' || fmt === 'PNG';
}
