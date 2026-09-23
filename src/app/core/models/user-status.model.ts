export type UserStatus = 'ACTIVE' | 'INACTIVE';

export const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: $localize`:@@userStatus.active:Activo`,
  INACTIVE: $localize`:@@userStatus.inactive:Inactivo`,
};
