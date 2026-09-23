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
  /** Nombre completo de quien lo subió (solo para mostrar). */
  uploadedBy: string;
  /** Id de quien lo subió: los permisos comparan por id, nunca por nombre (D34). */
  uploadedById: number;
  createdAt: string;
  sensitivityLevel: SensitivityLevel;
}
