import { Role } from '@core/models/role.model';

export type QuickActionId = 'upload' | 'search' | 'list' | 'users' | 'categories';
export type QuickActionVariant = 'primary' | 'success' | 'info' | 'warning' | 'purple';

export interface QuickAction {
  id: QuickActionId;
  title: string;
  description: string;
  icon: string;
  routerLink: string;
  variant: QuickActionVariant;
  adminBadge?: boolean;
}

export const ALL_QUICK_ACTIONS: Record<QuickActionId, QuickAction> = {
  upload: {
    id: 'upload',
    title: $localize`:@@dashboard.quickAction.upload.title:Subir documento`,
    description: $localize`:@@dashboard.quickAction.upload.description:Cargar un nuevo archivo al repositorio`,
    icon: 'upload',
    routerLink: '/documents',
    variant: 'primary',
  },
  search: {
    id: 'search',
    title: $localize`:@@dashboard.quickAction.search.title:Buscar documentos`,
    description: $localize`:@@dashboard.quickAction.search.description:Encontrar por nombre, categoría o fecha`,
    icon: 'search',
    routerLink: '/documents',
    variant: 'success',
  },
  list: {
    id: 'list',
    title: $localize`:@@dashboard.quickAction.list.title:Ver todos los documentos`,
    description: $localize`:@@dashboard.quickAction.list.description:Explorar el listado completo del repositorio`,
    icon: 'folder_open',
    routerLink: '/documents',
    variant: 'info',
  },
  users: {
    id: 'users',
    title: $localize`:@@dashboard.quickAction.users.title:Gestionar usuarios`,
    description: $localize`:@@dashboard.quickAction.users.description:Administrar las cuentas del personal`,
    icon: 'group',
    routerLink: '/users',
    variant: 'warning',
    adminBadge: true,
  },
  categories: {
    id: 'categories',
    title: $localize`:@@dashboard.quickAction.categories.title:Gestionar categorías`,
    description: $localize`:@@dashboard.quickAction.categories.description:Editar las categorías documentales`,
    icon: 'label',
    routerLink: '/categories',
    variant: 'purple',
    adminBadge: true,
  },
};

export const ROLE_ACTION_IDS: Record<Role, QuickActionId[]> = {
  ADMIN: ['upload', 'search', 'list', 'users', 'categories'],
  EDITOR: ['upload', 'search', 'list'],
  READER: ['search', 'list'],
};

export function getQuickActionsForRole(role: Role): QuickAction[] {
  return ROLE_ACTION_IDS[role].map((id) => ALL_QUICK_ACTIONS[id]);
}
