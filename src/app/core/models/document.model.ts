import { DocumentFormat } from './document-format.model';
import { SensitivityLevel } from './sensitivity-level.model';

export interface Document {
  id: number;
  title: string;
  category: string;
  responsibleArea: string;
  documentDate: string;
  fileFormat: DocumentFormat;
  fileSizeBytes: number;
  uploadedBy: string;
  createdAt: string;
  sensitivityLevel: SensitivityLevel;
}
