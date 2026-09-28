import { CategoryStatus } from './category-status.model';
import { SensitivityLevel } from './sensitivity-level.model';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  status: CategoryStatus;
  documentCount: number;
  createdAt: string;
  createdBy: string;
  defaultSensitivityLevel: SensitivityLevel;
  /** Requiere aprobación (HU-31). Siempre presente en las respuestas; `false` en las categorías anteriores a la HU. */
  requiresApproval: boolean;
}

// Límites de validación compartidos con el backend (FRM-02).
export const MIN_CATEGORY_NAME_LENGTH = 3;
export const MAX_CATEGORY_NAME_LENGTH = 100;
export const MAX_CATEGORY_DESCRIPTION_LENGTH = 500;
