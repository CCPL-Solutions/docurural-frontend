import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { DocumentFormat } from '@core/models/document-format.model';
import {
  buildFallbackFilename,
  parseFilenameFromContentDisposition,
  triggerBlobDownload,
} from '@shared/utils/download-blob';
import { DocumentsService } from './documents.service';
import { NotificationService } from './notification.service';

/** Lo mínimo de un documento para descargarlo (fila del listado, recientes o detalle). */
export interface DownloadableDocument {
  id: number;
  title: string;
  fileFormat: DocumentFormat;
  /** Si se conoce (detalle), se usa cuando el backend no envía `Content-Disposition`. */
  originalFileName?: string;
}

const DOWNLOAD_ERROR_TITLE = $localize`:@@download.error.title:No se pudo descargar el documento`;

/**
 * Único flujo de descarga de documentos (API-05): marca el documento como "descargando" (para
 * el spinner de cada botón), dispara la descarga y avisa con un toast de éxito o de error.
 */
@Injectable({ providedIn: 'root' })
export class DocumentDownloadService {
  private readonly documentsService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);

  private readonly downloading = signal<ReadonlySet<number>>(new Set());

  /** Ids de los documentos que se están descargando. */
  readonly downloadingIds = this.downloading.asReadonly();

  isDownloading(id: number): boolean {
    return this.downloading().has(id);
  }

  download(doc: DownloadableDocument): void {
    if (this.isDownloading(doc.id)) return;
    this.setDownloading(doc.id, true);

    this.documentsService
      .download(doc.id)
      .pipe(finalize(() => this.setDownloading(doc.id, false)))
      .subscribe({
        next: (response) => {
          const filename =
            parseFilenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
            doc.originalFileName ??
            buildFallbackFilename(doc.title, doc.fileFormat);
          triggerBlobDownload(response.body!, filename);
          this.notifications.success($localize`:@@download.started:Descarga iniciada`, filename);
        },
        error: (err: HttpErrorResponse) => {
          const fallback =
            err.status === HttpStatusCode.NotFound
              ? $localize`:@@download.error.notFound:El archivo no está disponible. Contacte al administrador.`
              : $localize`:@@download.error.network:Verifique su conexión e intente nuevamente.`;
          this.notifications.httpError(err, DOWNLOAD_ERROR_TITLE, fallback);
        },
      });
  }

  private setDownloading(id: number, value: boolean): void {
    this.downloading.update((ids) => {
      const next = new Set(ids);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
