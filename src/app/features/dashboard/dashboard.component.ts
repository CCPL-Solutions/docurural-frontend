import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { DocumentsService } from '../../core/services/documents.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  DashboardStatsResponse,
  RecentDocumentItem,
} from '../../core/models/dashboard-stats.model';
import { ApiError } from '../../core/models/api-error.model';
import { getQuickActionsForRole } from './utils/quick-action.model';
import {
  parseFilenameFromContentDisposition,
  buildFallbackFilename,
  triggerBlobDownload,
  parseBlobError,
} from '../documents/document-list/utils/download-blob';
import {
  UploadDocumentDialogComponent,
  UploadDocumentDialogData,
  UploadDocumentDialogResult,
} from '../documents/document-list/components/upload-document-dialog/upload-document-dialog.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { TopCategoryCardComponent } from './components/top-category-card/top-category-card.component';
import { CategoryChartComponent } from './components/category-chart/category-chart.component';
import { RecentDocsTableComponent } from './components/recent-docs-table/recent-docs-table.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatDialogModule,
    PageHeaderComponent,
    EmptyStateComponent,
    KpiCardComponent,
    TopCategoryCardComponent,
    CategoryChartComponent,
    RecentDocsTableComponent,
    QuickActionsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboardSvc = inject(DashboardService);
  private readonly documentsSvc = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly stats = signal<DashboardStatsResponse | null>(null);

  protected readonly role = computed(() => this.auth.currentUser()?.role ?? 'READER');
  protected readonly firstName = computed(
    () => this.auth.currentUser()?.fullName?.split(' ')[0] ?? '',
  );
  protected readonly canUpload = computed(
    () => this.role() === 'ADMIN' || this.role() === 'EDITOR',
  );
  protected readonly quickActions = computed(() => getQuickActionsForRole(this.role()));
  protected readonly isEmptyRepo = computed(
    () => (this.stats()?.summary.totalActiveDocuments ?? 0) === 0,
  );
  protected readonly currentMonthLabel = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  ngOnInit(): void {
    this.loadStats();
  }

  protected loadStats(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardSvc.getStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const apiErr = err.error as ApiError;
        this.error.set(apiErr?.message ?? 'No se pudo cargar el panel de control.');
        this.loading.set(false);
      },
    });
  }

  protected onView(docId: number): void {
    this.router.navigate(['/documents', docId]);
  }

  protected onDownload(doc: RecentDocumentItem): void {
    this.documentsSvc.download(doc.id).subscribe({
      next: (response) => {
        const blob = response.body!;
        const header = response.headers.get('Content-Disposition');
        const filename =
          parseFilenameFromContentDisposition(header) ??
          buildFallbackFilename(doc.title, doc.fileFormat);
        triggerBlobDownload(blob, filename);
      },
      error: async (err: HttpErrorResponse) => {
        const apiErr = await parseBlobError(err);
        this.notifications.error(
          'Error al descargar',
          apiErr?.message ?? 'No se pudo descargar el documento.',
        );
      },
    });
  }

  protected onUploadDoc(): void {
    if (!this.canUpload()) return;
    const ref = this.dialog.open<
      UploadDocumentDialogComponent,
      UploadDocumentDialogData,
      UploadDocumentDialogResult
    >(UploadDocumentDialogComponent, {
      data: {},
      width: '620px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.kind === 'uploaded') {
        this.loadStats();
      }
    });
  }
}
