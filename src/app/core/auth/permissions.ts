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

/** ADMIN edita cualquier documento; EDITOR, solo los que subió. Compara ids, no nombres (D34, R5). */
export function canEditDocument(
  role: Role,
  currentUserId: number | null | undefined,
  uploadedById: number,
): boolean {
  return (
    isAdmin(role) || (isEditor(role) && currentUserId != null && uploadedById === currentUserId)
  );
}

export function canDeleteDocument(role: Role): boolean {
  return isAdmin(role);
}

export function canUploadDocument(role: Role): boolean {
  return isAdmin(role) || isEditor(role);
}
