import { Role } from '@core/models/role.model';

// Único punto donde se decide qué puede hacer cada rol. Las comparaciones con 'ADMIN' o 'EDITOR'
// fuera de este archivo están prohibidas (D33).

export function isAdmin(role: Role | null | undefined): boolean {
  return role === 'ADMIN';
}

export function isEditor(role: Role | null | undefined): boolean {
  return role === 'EDITOR';
}

/** Solo un ADMIN filtra el listado de documentos por quién los subió. */
export function canSeeUploadedByFilter(role: Role | null | undefined): boolean {
  return isAdmin(role);
}

// TODO(Fase 6): comparar por id (uploadedById) en lugar de por nombre (D34, R5).
export function canEditDocument(role: Role, currentUserName: string, uploadedBy: string): boolean {
  return isAdmin(role) || (isEditor(role) && uploadedBy === currentUserName);
}

export function canDeleteDocument(role: Role): boolean {
  return isAdmin(role);
}

export function canUploadDocument(role: Role): boolean {
  return isAdmin(role) || isEditor(role);
}
