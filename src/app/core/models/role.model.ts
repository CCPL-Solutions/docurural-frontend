export type Role = 'ADMIN' | 'EDITOR' | 'READER';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: $localize`:@@role.admin:Administrador`,
  EDITOR: $localize`:@@role.editor:Editor`,
  READER: $localize`:@@role.reader:Lector`,
};
