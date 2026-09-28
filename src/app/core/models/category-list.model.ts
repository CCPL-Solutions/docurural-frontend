import { Category } from './category.model';
import { CategoryStatus } from './category-status.model';
import { SensitivityLevel } from './sensitivity-level.model';

export type CategorySortBy = 'name' | 'createdAt';
export type CategorySortDir = 'asc' | 'desc';

export interface CategoryListResponse {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  categories: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  description: string | null;
  defaultSensitivityLevel: SensitivityLevel;
  /** Se envía siempre (HU-31, research R1). */
  requiresApproval: boolean;
}

export interface CreateCategoryResponse {
  id: number;
  name: string;
  description: string | null;
  status: CategoryStatus;
  createdAt: string;
  defaultSensitivityLevel: SensitivityLevel;
  requiresApproval: boolean;
  message: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string | null;
  defaultSensitivityLevel: SensitivityLevel;
  /** Se envía siempre (HU-31, research R1). */
  requiresApproval: boolean;
}

export interface UpdateCategoryResponse {
  id: number;
  name: string;
  description: string | null;
  status: CategoryStatus;
  defaultSensitivityLevel: SensitivityLevel;
  requiresApproval: boolean;
  message: string;
}

export interface UpdateCategoryStatusRequest {
  status: CategoryStatus;
}

export interface UpdateCategoryStatusResponse {
  id: number;
  name: string;
  status: CategoryStatus;
  message: string;
}
