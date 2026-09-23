import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnInit,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthService } from '@core/services/auth.service';
import { DocumentDownloadService } from '@core/services/document-download.service';
import { DashboardService } from '@core/services/dashboard.service';
import { NotificationService } from '@core/services/notification.service';
import { DashboardStatsResponse, RecentDocumentItem } from '@core/models/dashboard-stats.model';
import { getQuickActionsForRole } from './utils/quick-action.model';
import {
  UploadDocumentDialogComponent,
  UploadDocumentDialogData,
  UploadDocumentDialogResult,
} from '@features/documents/dialogs/upload-document-dialog/upload-document-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { TopCategoryCardComponent } from './components/top-category-card/top-category-card.component';
import { CategoryChartComponent } from './components/category-chart/category-chart.component';
import { RecentDocsTableComponent } from './components/recent-docs-table/recent-docs-table.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { formatDate } from '@angular/common';
import { canUploadDocument } from '@core/auth/permissions';
import { MONTH_YEAR_FORMAT } from '@shared/utils/date-formats';
import { DIALOG_LG } from '@shared/ui/dialog-sizes';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardSvc = inject(DashboardService);
  private readonly downloads = inject(DocumentDownloadService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  protected readonly loading = signal(true);
  protected readonly stats = signal<DashboardStatsResponse | null>(null);

  protected readonly role = computed(() => this.auth.currentUser()?.role ?? 'READER');
  protected readonly firstName = computed(
    () => this.auth.currentUser()?.fullName?.split(' ')[0] ?? '',
  );
  protected readonly welcomeTitle = computed(
    () => $localize`:@@dashboard.welcome:Bienvenido, ${this.firstName()}:name:`,
  );
  protected readonly canUpload = computed(() => canUploadDocument(this.role()));
  protected readonly downloadingIds = this.downloads.downloadingIds;
  protected readonly quickActions = computed(() => getQuickActionsForRole(this.role()));
  protected readonly isEmptyRepo = computed(
    () => (this.stats()?.summary.totalActiveDocuments ?? 0) === 0,
  );
  protected readonly currentMonthLabel = formatDate(
    new Date(),
    MONTH_YEAR_FORMAT,
    inject(LOCALE_ID),
  );

  ngOnInit(): void {
    this.loadStats();
  }

  protected loadStats(): void {
    this.loading.set(true);
    this.dashboardSvc
      .getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (s) => {
          this.stats.set(s);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.notifications.httpError(
            err,
            $localize`:@@dashboard.loadError.title:No se pudo cargar el panel de control`,
            $localize`:@@common.error.checkConnection:Verifique su conexión e intente nuevamente.`,
          );
        },
      });
  }

  protected onDownload(doc: RecentDocumentItem): void {
    this.downloads.download(doc);
  }

  protected onUploadDoc(): void {
    if (!this.canUpload()) return;
    const ref = this.dialog.open<
      UploadDocumentDialogComponent,
      UploadDocumentDialogData,
      UploadDocumentDialogResult
    >(UploadDocumentDialogComponent, {
      data: {},
      ...DIALOG_LG,
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.kind === 'uploaded') {
          this.loadStats();
        }
      });
  }
}
