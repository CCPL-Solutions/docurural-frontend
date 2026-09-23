// Tests que reproducen los riesgos R2 y R3 de docs/auditoria-consistencia.md (Fase 1, tarea 1.7).
// Están marcados con `it.fails`: describen el comportamiento correcto y hoy fallan. Cuando la
// Fase 7 los corrija (tareas 7.2 y 7.3), deben pasar a `it`.
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { DocumentDetailResponse } from '@core/models/document-detail.model';
import { DocumentListResponse } from '@core/models/document-list.model';
import { Document } from '@core/models/document.model';
import { AuthService } from '@core/services/auth.service';
import { DocumentsService } from '@core/services/documents.service';
import { NotificationService } from '@core/services/notification.service';
import { DocumentDetailComponent } from './document-detail/document-detail.component';
import { DocumentListComponent } from './document-list/document-list.component';

const user = { id: 1, fullName: 'Ana Pérez', email: 'a@b.co', role: 'ADMIN' as const };

function providers(documents: Partial<DocumentsService>, route?: Partial<ActivatedRoute>) {
  return [
    provideRouter([]),
    { provide: DocumentsService, useValue: documents },
    { provide: AuthService, useValue: { currentUser: signal(user) } },
    { provide: NotificationService, useValue: { error: vi.fn(), success: vi.fn() } },
    ...(route ? [{ provide: ActivatedRoute, useValue: route }] : []),
  ];
}

describe('R2 — listado de documentos', () => {
  const doc = (id: number): Document => ({
    id,
    title: `Documento ${id}`,
    category: 'Actas',
    responsibleArea: 'Rectoría',
    documentDate: '2026-01-01',
    fileFormat: 'PDF',
    fileSizeBytes: 100,
    uploadedBy: 'Ana Pérez',
    createdAt: '2026-01-01T00:00:00Z',
    sensitivityLevel: 'INTERNAL',
  });
  const page = (n: number): DocumentListResponse => ({
    totalDocuments: 50,
    totalPages: 5,
    currentPage: n,
    pageSize: 10,
    documents: [doc(n * 100)],
    searchTerm: null,
    activeFilters: null,
  });

  it.fails('muestra los datos de la última página pedida aunque su respuesta llegue antes', () => {
    const responses: Subject<DocumentListResponse>[] = [];
    const list = vi.fn(() => {
      const response = new Subject<DocumentListResponse>();
      responses.push(response);
      return response;
    });
    TestBed.configureTestingModule({
      providers: providers({
        list,
        filterOptions: () => of({ categories: [], users: null }),
      }),
    });
    const component = TestBed.runInInjectionContext(() => new DocumentListComponent());

    component.ngOnInit();
    responses[0].next(page(1));
    component['goToPage'](2);
    component['goToPage'](3);
    // La respuesta de la página 3 llega antes que la de la 2.
    responses[2].next(page(3));
    responses[1].next(page(2));

    expect(component['currentPage']()).toBe(3);
    expect(component['documents']().map((d) => d.id)).toEqual([300]);
  });
});

describe('R3 — detalle de documento', () => {
  const detail: DocumentDetailResponse = {
    id: 5,
    title: 'Acta',
    description: null,
    category: { id: 1, name: 'Actas' },
    responsibleArea: 'Rectoría',
    documentDate: '2026-01-01',
    fileFormat: 'PDF',
    fileSizeBytes: 100,
    originalFileName: 'acta.pdf',
    uploadedBy: { id: 1, fullName: 'Ana Pérez' },
    createdAt: '2026-01-01T00:00:00Z',
    sensitivityLevel: 'INTERNAL',
  };
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  let blob$: Subject<Blob>;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    blob$ = new Subject<Blob>();
    TestBed.configureTestingModule({
      providers: providers(
        { getById: () => of(detail), getViewBlob: () => blob$ },
        { snapshot: { paramMap: convertToParamMap({ id: '5' }) } as ActivatedRoute['snapshot'] },
      ),
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it('revoca la URL de la vista previa al destruirse', () => {
    const component = TestBed.runInInjectionContext(() => new DocumentDetailComponent());
    blob$.next(new Blob(['%PDF']));
    component.ngOnDestroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it.fails('no crea una URL de vista previa si la respuesta llega tras destruirse', () => {
    const component = TestBed.runInInjectionContext(() => new DocumentDetailComponent());
    component.ngOnDestroy();
    blob$.next(new Blob(['%PDF']));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
