import { Role } from '@core/models/role.model';

export function canEditDocument(role: Role, currentUserName: string, uploadedBy: string): boolean {
  return role === 'ADMIN' || (role === 'EDITOR' && uploadedBy === currentUserName);
}

export function canDeleteDocument(role: Role): boolean {
  return role === 'ADMIN';
}

export function canUploadDocument(role: Role): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}
