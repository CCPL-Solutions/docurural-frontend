import { TestBed } from '@angular/core/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { CategoriesService } from './categories.service';
import { DashboardService } from './dashboard.service';
import { DocumentsService } from './documents.service';
import { UsersService } from './users.service';

const API = environment.apiBaseUrl;

describe('servicios de la API', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('CategoriesService', () => {
    let service: CategoriesService;
    beforeEach(() => (service = TestBed.inject(CategoriesService)));

    it('list ordena por nombre ascendente por defecto', () => {
      service.list().subscribe();
      const req = http.expectOne((r) => r.url === `${API}/categories`);
      expect(req.request.params.get('sortBy')).toBe('name');
      expect(req.request.params.get('sortDir')).toBe('asc');
      req.flush({ totalCategories: 0, activeCategories: 0, inactiveCategories: 0, categories: [] });
    });

    it('create, update y updateStatus usan POST, PUT y PATCH', () => {
      const payload = {
        name: 'Actas',
        description: null,
        defaultSensitivityLevel: 'INTERNAL' as const,
      };
      service.create(payload).subscribe();
      service.update(7, payload).subscribe();
      service.updateStatus(7, 'INACTIVE').subscribe();

      expect(http.expectOne(`${API}/categories`).request.method).toBe('POST');
      expect(http.expectOne(`${API}/categories/7`).request.method).toBe('PUT');
      const patch = http.expectOne(`${API}/categories/7/status`);
      expect(patch.request.method).toBe('PATCH');
      expect(patch.request.body).toEqual({ status: 'INACTIVE' });
    });
  });

  describe('DocumentsService', () => {
    let service: DocumentsService;
    beforeEach(() => (service = TestBed.inject(DocumentsService)));

    it('list envía paginación y orden, y omite los filtros vacíos', () => {
      service
        .list({
          page: 2,
          size: 10,
          sortBy: 'title',
          sortDir: 'asc',
          q: '   ',
          responsibleArea: '',
          categoryId: undefined,
        })
        .subscribe();
      const req = http.expectOne((r) => r.url === `${API}/documents`);
      expect(req.request.params.keys().sort()).toEqual(['page', 'size', 'sortBy', 'sortDir']);
      expect(req.request.params.get('page')).toBe('2');
    });

    it('list recorta la búsqueda y el área, e incluye los filtros con valor', () => {
      service
        .list({
          page: 1,
          size: 10,
          sortBy: 'createdAt',
          sortDir: 'desc',
          q: '  acta  ',
          categoryId: 3,
          responsibleArea: ' Rectoría ',
          dateFrom: '2026-01-01',
          dateTo: '2026-12-31',
          uploadedBy: 9,
        })
        .subscribe();
      const params = http.expectOne((r) => r.url === `${API}/documents`).request.params;
      expect(params.get('q')).toBe('acta');
      expect(params.get('responsibleArea')).toBe('Rectoría');
      expect(params.get('categoryId')).toBe('3');
      expect(params.get('dateFrom')).toBe('2026-01-01');
      expect(params.get('dateTo')).toBe('2026-12-31');
      expect(params.get('uploadedBy')).toBe('9');
    });

    it('filterOptions, getById, update y deleteLogical apuntan al recurso correcto', () => {
      service.filterOptions().subscribe();
      service.getById(5).subscribe();
      service
        .update(5, {
          title: 't',
          categoryId: 1,
          responsibleArea: 'Rectoría',
          documentDate: '2026-01-01',
          sensitivityLevel: 'INTERNAL',
        })
        .subscribe();
      service.deleteLogical(5).subscribe();

      expect(http.expectOne(`${API}/documents/filter-options`).request.method).toBe('GET');
      const byId = http.match(`${API}/documents/5`);
      expect(byId.map((r) => r.request.method)).toEqual(['GET', 'PUT', 'DELETE']);
    });

    it('create y createBatch envían FormData; createBatch reporta progreso', () => {
      const fd = new FormData();
      service.create(fd).subscribe();
      const events: HttpEventType[] = [];
      service.createBatch(fd).subscribe((e) => events.push(e.type));

      const single = http.expectOne(`${API}/documents`);
      expect(single.request.body).toBe(fd);
      const batch = http.expectOne(`${API}/documents/batch`);
      expect(batch.request.reportProgress).toBe(true);
      batch.event({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
      batch.flush({ totalReceived: 1, totalSuccessful: 1, totalFailed: 0, results: [] });
      expect(events).toContain(HttpEventType.UploadProgress);
      expect(events).toContain(HttpEventType.Response);
    });

    it('getViewBlob y download piden un Blob; download expone la respuesta completa', () => {
      service.getViewBlob(5).subscribe();
      let headers: string | null = null;
      service.download(5).subscribe((res) => (headers = res.headers.get('Content-Disposition')));

      expect(http.expectOne(`${API}/documents/5/view`).request.responseType).toBe('blob');
      const download = http.expectOne(`${API}/documents/5/download`);
      expect(download.request.responseType).toBe('blob');
      download.flush(new Blob(['x']), {
        headers: { 'Content-Disposition': 'attachment; filename="a.pdf"' },
      });
      expect(headers).toBe('attachment; filename="a.pdf"');
    });
  });

  describe('UsersService', () => {
    let service: UsersService;
    beforeEach(() => (service = TestBed.inject(UsersService)));

    it('list ordena por nombre completo ascendente por defecto', () => {
      service.list().subscribe();
      const req = http.expectOne((r) => r.url === `${API}/users`);
      expect(req.request.params.get('sortBy')).toBe('fullName');
      expect(req.request.params.get('sortDir')).toBe('asc');
      req.flush({ totalUsers: 0, users: [] });
    });

    it('create, update y updateStatus usan POST, PUT y PATCH', () => {
      service
        .create({
          fullName: 'Ana',
          email: 'a@b.co',
          password: 'x',
          confirmPassword: 'x',
          role: 'READER',
          canApprove: false,
        })
        .subscribe();
      service.update(3, { fullName: 'Ana', email: 'a@b.co', role: 'EDITOR' }).subscribe();
      service.updateStatus(3, 'ACTIVE').subscribe();

      expect(http.expectOne(`${API}/users`).request.method).toBe('POST');
      expect(http.expectOne(`${API}/users/3`).request.method).toBe('PUT');
      const patch = http.expectOne(`${API}/users/3/status`);
      expect(patch.request.method).toBe('PATCH');
      expect(patch.request.body).toEqual({ status: 'ACTIVE' });
    });
  });

  it('DashboardService.getStats consulta /dashboard/stats', () => {
    TestBed.inject(DashboardService).getStats().subscribe();
    expect(http.expectOne(`${API}/dashboard/stats`).request.method).toBe('GET');
  });
});
