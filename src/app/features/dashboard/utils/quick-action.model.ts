import { Role } from '../../../core/models/role.model';

export type QuickActionId = 'upload' | 'search' | 'list' | 'users' | 'categories';
export type QuickActionVariant = 'primary' | 'success' | 'info' | 'warning' | 'purple';

export interface QuickAction {
  id: QuickActionId;
  title: string;
  description: string;
  icon: string;
  routerLink: string;
  queryParams?: Record<string, string>;
  variant: QuickActionVariant;
  adminBadge?: boolean;
}

export const ALL_QUICK_ACTIONS: Record<QuickActionId, QuickAction> = {
  upload: {
    id: 'upload',
    title: 'Subir documento',
    description: 'Cargar un nuevo archivo al repositorio',
    icon: 'upload',
    routerLink: '/documents',
    queryParams: { action: 'upload' },
    variant: 'primary',
  },
  search: {
    id: 'search',
    title: 'Buscar documentos',
    description: 'Encontrar por nombre, categoría o fecha',
    icon: 'search',
    routerLink: '/documents',
    variant: 'success',
  },
  list: {
    id: 'list',
    title: 'Ver todos los documentos',
    description: 'Explorar el listado completo del repositorio',
    icon: 'folder_open',
    routerLink: '/documents',
    variant: 'info',
  },
  users: {
    id: 'users',
    title: 'Gestionar usuarios',
    description: 'Administrar las cuentas del personal',
    icon: 'group',
    routerLink: '/users',
    variant: 'warning',
    adminBadge: true,
  },
  categories: {
    id: 'categories',
    title: 'Gestionar categorías',
    description: 'Editar las categorías documentales',
    icon: 'label',
    routerLink: '/categories',
    variant: 'purple',
    adminBadge: true,
  },
};

export const ROLE_ACTION_IDS: Record<Role, QuickActionId[]> = {
  ADMIN:  ['upload', 'search', 'list', 'users', 'categories'],
  EDITOR: ['upload', 'search', 'list'],
  READER: ['search', 'list'],
};

export function getQuickActionsForRole(role: Role): QuickAction[] {
  return ROLE_ACTION_IDS[role].map((id) => ALL_QUICK_ACTIONS[id]);
}
