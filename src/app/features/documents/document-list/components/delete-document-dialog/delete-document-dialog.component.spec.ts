import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { Document } from '@core/models/document.model';
import { DocumentsService } from '@core/services/documents.service';
import { DeleteDocumentDialogComponent } from './delete-document-dialog.component';

const doc: Document = {
  id: 7,
  title: 'Acta 7',
  category: 'Actas',
  responsibleArea: 'Rectoría',
  documentDate: '2026-01-01',
  fileFormat: 'PDF',
  fileSizeBytes: 2048,
  uploadedBy: 'Ana Pérez',
  uploadedById: 2,
  createdAt: '2026-01-01T00:00:00Z',
  sensitivityLevel: 'INTERNAL',
};

describe('DeleteDocumentDialogComponent', () => {
  let deleteLogical: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;

  async function render() {
    close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { document: doc } },
        { provide: MatDialogRef, useValue: { close, disableClose: false } },
        { provide: DocumentsService, useValue: { deleteLogical } },
      ],
    });
    const fixture = TestBed.createComponent(DeleteDocumentDialogComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>('#delete-confirmation-input')!;
    const confirmButton = () => host.querySelectorAll('button')[1];
    const type = async (text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    return { fixture, host, input, confirmButton, type };
  }

  beforeEach(() => {
    deleteLogical = vi.fn(() => of({ id: 7, message: 'Documento eliminado' }));
  });

  it('pide escribir la palabra de confirmación', async () => {
    const { host, input } = await render();

    expect(host.querySelector('.dialog__confirm-code')?.textContent).toBe('ELIMINAR');
    expect(input.getAttribute('aria-label')).toBe('Escriba ELIMINAR para confirmar la eliminación');
    expect(host.querySelector('.dialog__doc-meta')?.textContent).toContain('subido por');
  });

  it('solo habilita la eliminación con la palabra correcta, sin distinguir mayúsculas', async () => {
    const { confirmButton, type } = await render();
    expect(confirmButton().disabled).toBe(true);

    await type('borrar');
    expect(confirmButton().disabled).toBe(true);

    await type(' eliminar ');
    expect(confirmButton().disabled).toBe(false);
  });

  it('elimina y devuelve el resultado', async () => {
    const { fixture, confirmButton, type } = await render();
    await type('ELIMINAR');

    confirmButton().click();
    await fixture.whenStable();

    expect(deleteLogical).toHaveBeenCalledWith(7);
    expect(close).toHaveBeenCalledWith({
      success: true,
      documentId: 7,
      message: 'Documento eliminado',
    });
  });

  it.each([
    [403, 'No tiene permisos para eliminar documentos.', true],
    [404, 'El documento ya no existe o fue eliminado.', true],
    [500, 'No fue posible eliminar el documento.', false],
  ])('un %i muestra su mensaje', async (status, message, blocks) => {
    deleteLogical = vi.fn(() => throwError(() => new HttpErrorResponse({ status })));
    const { fixture, host, confirmButton, type } = await render();
    await type('ELIMINAR');

    confirmButton().click();
    await fixture.whenStable();

    expect(host.querySelector('app-alert')?.textContent).toContain(message);
    expect(confirmButton().disabled).toBe(blocks);
  });
});
