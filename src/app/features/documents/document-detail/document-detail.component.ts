import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentsService } from '../../../core/services/documents.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DocumentDetailResponse, isPreviewableFormat } from '../../../core/models/document-detail.model';
import { DOCUMENT_FORMAT_LABELS } from '../../../core/models/document-format.model';
import { ApiError } from '../../../core/models/api-error.model';
import { formatFileSize } from '../document-list/utils/file-size';
import {
  parseBlobError,
  parseFilenameFromContentDisposition,
  triggerBlobDownload,
} from '../document-list/utils/download-blob';
import { canEditDocument } from '../document-list/utils/document-permissions';
import {
  EditDocumentMetadataDialogComponent,
  EditDocumentMetadataDialogData,
  EditDocumentMetadataDialogResult,
} from '../document-list/components/edit-document-metadata-dialog/edit-document-metadata-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { DocumentFormatIconComponent } from '../document-list/components/document-format-icon.component';
import { DocumentCategoryPillComponent } from '../document-list/components/document-category-pill.component';
import { SensitivityBadgeComponent } from '../../../shared/sensitivity/sensitivity-badge.component';

type ErrorKind = 'not-found' | 'file-missing' | 'network';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ButtonComponent,
    IconButtonComponent,
    DocumentFormatIconComponent,
    DocumentCategoryPillComponent,
    SensitivityBadgeComponent,
  ],
  templateUrl: './document-detail.component.html',
  styleUrl: './document-detail.component.scss',
})
export class DocumentDetailComponent implements OnDestroy {
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly sanitizer     = inject(DomSanitizer);
  private readonly docService    = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth          = inject(AuthService);
  private readonly dialog        = inject(MatDialog);

  private docId = NaN;

  protected readonly imageContainer = viewChild<ElementRef<HTMLElement>>('imageContainer');

  protected readonly loadingMetadata = signal(true);
  protected readonly loadingBlob     = signal(false);
  protected readonly downloading     = signal(false);
  protected readonly metadata        = signal<DocumentDetailResponse | null>(null);
  protected readonly objectUrl       = signal<string | null>(null);
  protected readonly errorKind       = signal<ErrorKind | null>(null);
  protected readonly zoomLevel       = signal(1);

  protected readonly safeUrl = computed(() => {
    const url = this.objectUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  protected readonly formatLabel = computed(() => {
    const meta = this.metadata();
    return meta ? DOCUMENT_FORMAT_LABELS[meta.fileFormat] : '';
  });

  protected readonly zoomPercent = computed(() => Math.round(this.zoomLevel() * 100));

  protected readonly canEdit = computed(() => {
    const meta = this.metadata();
    const user = this.auth.currentUser();
    if (!meta || !user) return false;
    return canEditDocument(user.role, user.fullName, meta.uploadedBy.fullName);
  });

  protected readonly formatFileSize = formatFileSize;

  protected userInitials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }

  private readonly docDateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  private readonly loadedAtFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  constructor() {
    const raw = this.route.snapshot.paramMap.get('id');
    const id  = raw ? parseInt(raw, 10) : NaN;

    if (Number.isNaN(id)) {
      this.notifications.error('Documento inválido', 'El identificador del documento no es válido.');
      this.router.navigate(['/documents']);
      return;
    }

    this.docId = id;
    this.loadDocument(id);
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  protected onBack(): void {
    this.router.navigate(['/documents']);
  }

  protected onEdit(): void {
    const meta = this.metadata();
    if (!meta) return;
    const ref = this.dialog.open<
      EditDocumentMetadataDialogComponent,
      EditDocumentMetadataDialogData,
      EditDocumentMetadataDialogResult
    >(EditDocumentMetadataDialogComponent, {
      data: { document: meta },
      width: '620px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.kind === 'updated') {
        this.loadDocument(this.docId);
      }
    });
  }

  protected onDownload(): void {
    const meta = this.metadata();
    if (!meta || this.downloading()) return;

    this.downloading.set(true);
    this.docService.download(meta.id).subscribe({
      next: (response) => {
        const filename =
          parseFilenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
          meta.originalFileName;
        triggerBlobDownload(response.body!, filename);
        this.notifications.success('Descarga iniciada', filename);
        this.downloading.set(false);
      },
      error: async (err: HttpErrorResponse) => {
        this.downloading.set(false);
        if (err.status === 401) return;
        if (err.status === 404) {
          const apiError = await parseBlobError(err);
          this.notifications.error(
            'No se pudo descargar el documento',
            apiError?.message ?? 'El archivo no está disponible. Contacte al administrador.',
          );
          return;
        }
        const apiError = await parseBlobError(err);
        this.notifications.error(
          'No se pudo descargar el documento',
          apiError?.message ?? 'Verifique su conexión e intente nuevamente.',
        );
      },
    });
  }

  protected zoomIn(): void {
    this.zoomLevel.update((z) => Math.min(+(z + 0.25).toFixed(2), 4));
  }

  protected zoomOut(): void {
    this.zoomLevel.update((z) => Math.max(+(z - 0.25).toFixed(2), 0.25));
  }

  protected onFullscreen(): void {
    const el = this.imageContainer()?.nativeElement;
    if (!el) return;
    el.requestFullscreen?.().catch(() => {});
  }

  protected formatDocumentDate(iso: string): string {
    const d = this.parseDate(iso);
    return d ? this.docDateFormatter.format(d) : '—';
  }

  protected formatCreatedAt(iso: string): string {
    const d = this.parseDate(iso);
    return d ? this.loadedAtFormatter.format(d) : '—';
  }

  private loadDocument(id: number): void {
    this.loadingMetadata.set(true);
    this.errorKind.set(null);

    this.docService.getById(id).subscribe({
      next: (res) => {
        this.metadata.set(res);
        this.loadingMetadata.set(false);

        if (isPreviewableFormat(res.fileFormat)) {
          this.loadBlob(id);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loadingMetadata.set(false);
        if (err.status === 401) return;
        if (err.status === 404) {
          this.errorKind.set('not-found');
          return;
        }
        this.errorKind.set('network');
        const apiError = err.error as ApiError | undefined;
        this.notifications.error(
          'No se pudo cargar el documento',
          apiError?.message ?? 'Verifique su conexión e intente nuevamente.',
        );
      },
    });
  }

  private loadBlob(id: number): void {
    this.loadingBlob.set(true);

    this.docService.getViewBlob(id).subscribe({
      next: (blob) => {
        this.revokeObjectUrl();
        const url = URL.createObjectURL(blob);
        this.objectUrl.set(url);
        this.loadingBlob.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingBlob.set(false);
        if (err.status === 401) return;
        if (err.status === 404) {
          this.errorKind.set('file-missing');
          return;
        }
        this.errorKind.set('network');
        const apiError = err.error as ApiError | undefined;
        this.notifications.error(
          'No se pudo cargar el archivo',
          apiError?.message ?? 'Verifique su conexión e intente nuevamente.',
        );
      },
    });
  }

  private revokeObjectUrl(): void {
    const url = this.objectUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.objectUrl.set(null);
    }
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
}
