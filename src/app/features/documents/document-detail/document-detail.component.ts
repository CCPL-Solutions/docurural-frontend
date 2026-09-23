import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { EMPTY, Observable, Subject, catchError, switchMap, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';
import { DocumentDownloadService } from '@core/services/document-download.service';
import { DocumentsService } from '@core/services/documents.service';
import { NotificationService } from '@core/services/notification.service';
import { DocumentDetailResponse, isPreviewableFormat } from '@core/models/document-detail.model';
import { DOCUMENT_FORMAT_LABELS } from '@core/models/document-format.model';
import { formatFileSize } from '@shared/utils/file-size';
import { canEditDocument } from '@core/auth/permissions';
import { DATE_FORMAT, DATE_TIME_FORMAT } from '@shared/utils/date-formats';
import { userInitials } from '@shared/utils/user-initials';
import {
  EditDocumentMetadataDialogComponent,
  EditDocumentMetadataDialogData,
  EditDocumentMetadataDialogResult,
} from '../dialogs/edit-document-metadata-dialog/edit-document-metadata-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { IconButtonComponent } from '@shared/components/icon-button/icon-button.component';
import { DocumentFormatIconComponent } from '@shared/components/document-format-icon/document-format-icon.component';
import { CategoryPillComponent } from '@shared/components/category-pill/category-pill.component';
import { SensitivityBadgeComponent } from '@shared/sensitivity/sensitivity-badge.component';
import { DatePipe } from '@angular/common';
import { DIALOG_LG } from '@shared/ui/dialog-sizes';

type ErrorKind = 'not-found' | 'file-missing' | 'network';

@Component({
  selector: 'app-document-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ButtonComponent,
    IconButtonComponent,
    DocumentFormatIconComponent,
    CategoryPillComponent,
    SensitivityBadgeComponent,
  ],
  templateUrl: './document-detail.component.html',
  styleUrl: './document-detail.component.scss',
})
export class DocumentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly docService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly downloads = inject(DocumentDownloadService);
  private readonly destroyRef = inject(DestroyRef);

  private docId = NaN;

  /**
   * Cada emisión carga los metadatos y, si se puede previsualizar, el archivo. `switchMap` cancela
   * la carga anterior (al recargar tras editar) y `takeUntilDestroyed`, la pendiente al salir: una
   * respuesta tardía ya no crea un object URL que nadie revoca (R3).
   */
  private readonly load$ = new Subject<number>();

  protected readonly imageContainer = viewChild<ElementRef<HTMLElement>>('imageContainer');

  protected readonly loadingMetadata = signal(true);
  protected readonly loadingBlob = signal(false);
  protected readonly metadata = signal<DocumentDetailResponse | null>(null);
  protected readonly objectUrl = signal<string | null>(null);
  protected readonly errorKind = signal<ErrorKind | null>(null);
  protected readonly zoomLevel = signal(1);

  protected readonly safeUrl = computed(() => {
    const url = this.objectUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  protected readonly formatLabel = computed(() => {
    const meta = this.metadata();
    return meta ? DOCUMENT_FORMAT_LABELS[meta.fileFormat] : '';
  });

  protected readonly noPreviewDescription = computed(
    () =>
      $localize`:@@documents.detail.noPreview.description:Los archivos ${this.formatLabel()}:format: se pueden descargar pero no se previsualizan en el navegador.`,
  );

  protected readonly loadingTitle = $localize`:@@documents.detail.loading:Cargando documento…`;

  protected readonly downloading = computed(() => {
    const meta = this.metadata();
    return meta !== null && this.downloads.isDownloading(meta.id);
  });

  protected readonly zoomPercent = computed(() => Math.round(this.zoomLevel() * 100));

  protected readonly canEdit = computed(() => {
    const meta = this.metadata();
    const user = this.auth.currentUser();
    if (!meta || !user) return false;
    return canEditDocument(user.role, user.id, meta.uploadedBy.id);
  });

  protected readonly formatFileSize = formatFileSize;
  protected readonly userInitials = userInitials;
  protected readonly dateFormat = DATE_FORMAT;
  protected readonly dateTimeFormat = DATE_TIME_FORMAT;

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeObjectUrl());
  }

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? parseInt(raw, 10) : NaN;

    if (Number.isNaN(id)) {
      this.notifications.error(
        $localize`:@@documents.detail.invalidId.title:Documento inválido`,
        $localize`:@@documents.detail.invalidId.description:El identificador del documento no es válido.`,
      );
      this.router.navigate(['/documents']);
      return;
    }

    this.docId = id;
    this.load$
      .pipe(
        switchMap((docId) =>
          this.fetchMetadata(docId).pipe(
            switchMap((meta) =>
              isPreviewableFormat(meta.fileFormat) ? this.fetchBlob(docId) : EMPTY,
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((blob) => {
        this.revokeObjectUrl();
        this.objectUrl.set(URL.createObjectURL(blob));
        this.loadingBlob.set(false);
      });
    this.load$.next(id);
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
      ...DIALOG_LG,
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.kind === 'updated') {
          this.load$.next(this.docId);
        }
      });
  }

  protected onDownload(): void {
    const meta = this.metadata();
    if (meta) this.downloads.download(meta);
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

  private fetchMetadata(id: number): Observable<DocumentDetailResponse> {
    this.loadingMetadata.set(true);
    this.errorKind.set(null);

    return this.docService.getById(id).pipe(
      tap((res) => {
        this.metadata.set(res);
        this.loadingMetadata.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.loadingMetadata.set(false);
        if (err.status === HttpStatusCode.NotFound) {
          this.errorKind.set('not-found');
          return EMPTY;
        }
        this.errorKind.set('network');
        this.notifications.httpError(
          err,
          $localize`:@@documents.detail.loadError.title:No se pudo cargar el documento`,
          $localize`:@@common.error.checkConnection:Verifique su conexión e intente nuevamente.`,
        );
        return EMPTY;
      }),
    );
  }

  private fetchBlob(id: number): Observable<Blob> {
    this.loadingBlob.set(true);

    return this.docService.getViewBlob(id).pipe(
      catchError((err: HttpErrorResponse) => {
        this.loadingBlob.set(false);
        if (err.status === HttpStatusCode.NotFound) {
          this.errorKind.set('file-missing');
          return EMPTY;
        }
        this.errorKind.set('network');
        this.notifications.httpError(
          err,
          $localize`:@@documents.detail.fileLoadError.title:No se pudo cargar el archivo`,
          $localize`:@@common.error.checkConnection:Verifique su conexión e intente nuevamente.`,
        );
        return EMPTY;
      }),
    );
  }

  private revokeObjectUrl(): void {
    const url = this.objectUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.objectUrl.set(null);
    }
  }
}
