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
});
