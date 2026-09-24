import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Document } from '@core/models/document.model';
import { Role } from '@core/models/role.model';
import { DocumentRowActionsComponent } from './document-row-actions.component';

const doc: Document = {
  id: 7,
  title: 'Acta 7',
  category: 'Actas',
  responsibleArea: 'Rectoría',
  documentDate: '2026-01-01',
  fileFormat: 'PDF',
  fileSizeBytes: 100,
  uploadedBy: 'Ana Pérez',
  uploadedById: 2,
  createdAt: '2026-01-01T00:00:00Z',
  sensitivityLevel: 'INTERNAL',
};

describe('DocumentRowActionsComponent', () => {
  async function render(role: Role, currentUserId: number | null) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(DocumentRowActionsComponent);
    fixture.componentRef.setInput('doc', doc);
    fixture.componentRef.setInput('role', role);
    fixture.componentRef.setInput('currentUserId', currentUserId);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('«Ver documento» es un enlace al detalle (D35)', async () => {
    const host = await render('READER', 1);

    const link = host.querySelector<HTMLAnchorElement>('a[aria-label="Ver documento"]');
    expect(link?.getAttribute('href')).toBe('/documents/7');
  });

  it('un EDITOR ve «Editar» en lo que subió', async () => {
    const host = await render('EDITOR', 2);

    expect(host.querySelector('[aria-label="Editar documento"]')).not.toBeNull();
  });

  // R5: con el mismo nombre («Ana Pérez») pero otro id, antes veía «Editar».
  it('R5: un EDITOR homónimo no ve «Editar» en documentos ajenos', async () => {
    const host = await render('EDITOR', 1);

    expect(host.querySelector('[aria-label="Editar documento"]')).toBeNull();
  });
});
