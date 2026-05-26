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
}
