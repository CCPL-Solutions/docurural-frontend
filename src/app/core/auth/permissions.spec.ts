import {
  canDeleteDocument,
  canHoldApprovalPermission,
  canEditDocument,
  canSeeUploadedByFilter,
  canUploadDocument,
  isActiveApprover,
  isAdmin,
  isEditor,
} from './permissions';
import { User } from '@core/models/user.model';

const user = (overrides: Partial<User> = {}): User => ({
  id: 7,
  fullName: 'Ana Gómez Torres',
  email: 'coordinadora@minayticha.edu.co',
  role: 'EDITOR',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  lastLogin: null,
  canApprove: true,
  ...overrides,
});

describe('permissions', () => {
  it('isAdmin e isEditor reconocen su rol y toleran la ausencia de sesión', () => {
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('EDITOR')).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isEditor('EDITOR')).toBe(true);
    expect(isEditor('READER')).toBe(false);
    expect(isEditor(null)).toBe(false);
  });

  it('canSeeUploadedByFilter: solo ADMIN', () => {
    expect(canSeeUploadedByFilter('ADMIN')).toBe(true);
    expect(canSeeUploadedByFilter('EDITOR')).toBe(false);
    expect(canSeeUploadedByFilter('READER')).toBe(false);
  });

  describe('canEditDocument', () => {
    it('permite a ADMIN editar cualquier documento', () => {
      expect(canEditDocument('ADMIN', 1, 2)).toBe(true);
    });

    it('permite a EDITOR editar solo lo que subió, comparando por id', () => {
      expect(canEditDocument('EDITOR', 1, 1)).toBe(true);
      expect(canEditDocument('EDITOR', 1, 2)).toBe(false);
    });

    // R5: antes se comparaba el nombre, y un EDITOR homónimo veía «Editar» en documentos ajenos.
    it('R5: un EDITOR homónimo no puede editar documentos ajenos', () => {
      expect(canEditDocument('EDITOR', 1, 2)).toBe(false);
    });

    it('sin usuario no permite editar', () => {
      expect(canEditDocument('EDITOR', null, 1)).toBe(false);
      expect(canEditDocument('EDITOR', undefined, 1)).toBe(false);
    });

    it('no permite a READER editar', () => {
      expect(canEditDocument('READER', 1, 1)).toBe(false);
    });
  });

  it('canDeleteDocument: solo ADMIN', () => {
    expect(canDeleteDocument('ADMIN')).toBe(true);
    expect(canDeleteDocument('EDITOR')).toBe(false);
    expect(canDeleteDocument('READER')).toBe(false);
  });

  it('canUploadDocument: ADMIN y EDITOR', () => {
    expect(canUploadDocument('ADMIN')).toBe(true);
    expect(canUploadDocument('EDITOR')).toBe(true);
    expect(canUploadDocument('READER')).toBe(false);
  });

  it('canHoldApprovalPermission: ADMIN y EDITOR, nunca READER ni sin rol', () => {
    expect(canHoldApprovalPermission('ADMIN')).toBe(true);
    expect(canHoldApprovalPermission('EDITOR')).toBe(true);
    expect(canHoldApprovalPermission('READER')).toBe(false);
    expect(canHoldApprovalPermission(null)).toBe(false);
    expect(canHoldApprovalPermission(undefined)).toBe(false);
  });
  it('isActiveApprover: activo, con el permiso y rol ADMIN o EDITOR (HU-31)', () => {
    expect(isActiveApprover(user())).toBe(true);
    expect(isActiveApprover(user({ role: 'ADMIN' }))).toBe(true);
    expect(isActiveApprover(user({ status: 'INACTIVE' }))).toBe(false);
    expect(isActiveApprover(user({ canApprove: false }))).toBe(false);
    expect(isActiveApprover(user({ role: 'READER' }))).toBe(false);
  });
});
