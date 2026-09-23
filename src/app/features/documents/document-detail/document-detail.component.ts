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
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
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
export class DocumentDetailComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly docService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly downloads = inject(DocumentDownloadService);

  private docId = NaN;

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
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? parseInt(raw, 10) : NaN;

    if (Number.isNaN(id)) {
      this.notifications.error(
        'Documento inválido',
        'El identificador del documento no es válido.',
      );
      this.router.navigate(['/documents']);
      return;
    }

    this.docId = id;
    this.loadDocument(id);
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
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
    ref.afterClosed().subscribe((result) => {
      if (result?.kind === 'updated') {
        this.loadDocument(this.docId);
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
        if (err.status === HttpStatusCode.NotFound) {
          this.errorKind.set('not-found');
          return;
        }
        this.errorKind.set('network');
        this.notifications.httpError(
          err,
          'No se pudo cargar el documento',
          'Verifique su conexión e intente nuevamente.',
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
        if (err.status === HttpStatusCode.NotFound) {
          this.errorKind.set('file-missing');
          return;
        }
        this.errorKind.set('network');
        this.notifications.httpError(
          err,
          'No se pudo cargar el archivo',
          'Verifique su conexión e intente nuevamente.',
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
}
