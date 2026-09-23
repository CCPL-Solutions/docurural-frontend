import {
  canDeleteDocument,
  canEditDocument,
  canSeeUploadedByFilter,
  canUploadDocument,
  isAdmin,
  isEditor,
} from './permissions';

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
      expect(canEditDocument('ADMIN', 'Ana Pérez', 'Otro Usuario')).toBe(true);
    });

    it('permite a EDITOR editar solo lo que subió', () => {
      expect(canEditDocument('EDITOR', 'Ana Pérez', 'Ana Pérez')).toBe(true);
      expect(canEditDocument('EDITOR', 'Ana Pérez', 'Otro Usuario')).toBe(false);
    });

    it('no permite a READER editar', () => {
      expect(canEditDocument('READER', 'Ana Pérez', 'Ana Pérez')).toBe(false);
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
});
