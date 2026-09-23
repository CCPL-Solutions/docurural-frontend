import { canDeleteDocument, canEditDocument, canUploadDocument } from './permissions';

describe('document-permissions', () => {
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
