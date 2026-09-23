import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DocumentDownloadService, DownloadableDocument } from './document-download.service';
import { DocumentsService } from './documents.service';
import { NotificationService } from './notification.service';

describe('DocumentDownloadService', () => {
  const doc: DownloadableDocument = { id: 7, title: 'Acta 1', fileFormat: 'PDF' };
  const notifications = { success: vi.fn(), httpError: vi.fn() };
  let response$: Subject<HttpResponse<Blob>>;
  let documents: { download: ReturnType<typeof vi.fn> };
  let service: DocumentDownloadService;
  /** Nombres de archivo de las descargas disparadas (atributo download del ancla). */
  let downloaded: string[];
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    notifications.success.mockReset();
    notifications.httpError.mockReset();
    response$ = new Subject();
    documents = { download: vi.fn(() => response$) };
    downloaded = [];
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloaded.push(this.download);
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: DocumentsService, useValue: documents },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    service = TestBed.inject(DocumentDownloadService);
  });

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    vi.restoreAllMocks();
  });

  const respond = (headers: Record<string, string> = {}) => {
    response$.next(new HttpResponse({ body: new Blob(['x']), headers: new HttpHeaders(headers) }));
    response$.complete();
  };

  it('marca el documento como descargando mientras dura la petición', () => {
    service.download(doc);
    expect(service.isDownloading(7)).toBe(true);
    expect(service.downloadingIds().has(7)).toBe(true);

    respond();
    expect(service.isDownloading(7)).toBe(false);
  });

  it('ignora un segundo clic mientras el mismo documento se descarga', () => {
    service.download(doc);
    service.download(doc);
    expect(documents.download).toHaveBeenCalledTimes(1);
  });

  it('usa el nombre de Content-Disposition y avisa del éxito', () => {
    service.download(doc);
    respond({ 'Content-Disposition': 'attachment; filename="acta-final.pdf"' });

    expect(downloaded).toEqual(['acta-final.pdf']);
    expect(notifications.success).toHaveBeenCalledWith('Descarga iniciada', 'acta-final.pdf');
  });

  it('sin Content-Disposition usa el nombre original y, si no lo hay, el título', () => {
    service.download({ ...doc, originalFileName: 'original.pdf' });
    respond();
    expect(downloaded.at(-1)).toBe('original.pdf');

    response$ = new Subject();
    service.download(doc);
    respond();
    expect(downloaded.at(-1)).toBe('Acta 1.pdf');
  });

  it('delega el error en httpError, con un texto según el estado, y libera el documento', () => {
    service.download(doc);
    const err = new HttpErrorResponse({ status: 404 });
    response$.error(err);

    expect(notifications.httpError).toHaveBeenCalledWith(
      err,
      'No se pudo descargar el documento',
      'El archivo no está disponible. Contacte al administrador.',
    );
    expect(service.isDownloading(7)).toBe(false);
  });
});
