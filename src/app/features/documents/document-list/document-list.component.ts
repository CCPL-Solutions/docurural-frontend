import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocumentsService } from '../../../core/services/documents.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Document } from '../../../core/models/document.model';
import {
  ActiveFiltersDto,
  DocumentSortBy,
  DocumentSortDir,
} from '../../../core/models/document-list.models';
import { ApiError } from '../../../core/models/api-error.model';
import {
  DocumentFilters,
  EMPTY_FILTERS,
  FilterChipDescriptor,
  countActiveFilters,
  hasAnyFilter,
} from '../../../core/models/document-filters.model';
import { FilterOptionsResponse } from '../../../core/models/filter-options.model';
import { canUploadDocument } from './utils/document-permissions';
import { formatFileSize } from './utils/file-size';
import {
  buildFallbackFilename,
  parseBlobError,
  parseFilenameFromContentDisposition,
  triggerBlobDownload,
} from './utils/download-blob';
import {
  UploadDocumentDialogComponent,
  UploadDocumentDialogData,
  UploadDocumentDialogResult,
} from './components/upload-document-dialog/upload-document-dialog.component';
import {
  UploadDocumentsBatchDialogComponent,
  UploadDocumentsBatchDialogData,
  UploadDocumentsBatchDialogResult,
} from './components/upload-documents-batch-dialog/upload-documents-batch-dialog.component';
import {
  EditDocumentMetadataDialogComponent,
  EditDocumentMetadataDialogData,
  EditDocumentMetadataDialogResult,
} from './components/edit-document-metadata-dialog/edit-document-metadata-dialog.component';
import {
  DeleteDocumentDialogComponent,
  DeleteDocumentDialogData,
  DeleteDocumentDialogResult,
} from './components/delete-document-dialog/delete-document-dialog.component';
import { DocumentFormatIconComponent } from './components/document-format-icon.component';
import { DocumentCategoryPillComponent } from './components/document-category-pill.component';
import { DocumentRowActionsComponent } from './components/document-row-actions.component';
import { DocumentSearchBarComponent } from './components/document-search-bar/document-search-bar.component';
import { DocumentFiltersPanelComponent } from './components/document-filters-panel/document-filters-panel.component';
import { DocumentFilterChipsComponent } from './components/document-filter-chips/document-filter-chips.component';
import { DocumentEmptyResultsComponent } from './components/document-empty-results/document-empty-results.component';
import {
  DocumentFiltersBottomSheetComponent,
  FiltersBottomSheetResult,
} from './components/document-filters-bottom-sheet/document-filters-bottom-sheet.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconButtonComponent } from '../../../shared/components/icon-button/icon-button.component';
import { SortTriggerComponent } from '../../../shared/components/sort-trigger/sort-trigger.component';
import { SensitivityBadgeComponent } from '../../../shared/sensitivity/sensitivity-badge.component';

type SortOption =
  | 'createdAtDesc'
  | 'createdAtAsc'
  | 'titleAsc'
  | 'titleDesc'
  | 'documentDateDesc'
  | 'documentDateAsc';

interface SortOptionConfig {
  value: SortOption;
  label: string;
  sortBy: DocumentSortBy;
  sortDir: DocumentSortDir;
}

const SORT_OPTIONS: SortOptionConfig[] = [
  { value: 'createdAtDesc', label: 'Más recientes', sortBy: 'createdAt', sortDir: 'desc' },
  { value: 'createdAtAsc', label: 'Más antiguos', sortBy: 'createdAt', sortDir: 'asc' },
  { value: 'titleAsc', label: 'Título A–Z', sortBy: 'title', sortDir: 'asc' },
  { value: 'titleDesc', label: 'Título Z–A', sortBy: 'title', sortDir: 'desc' },
  {
    value: 'documentDateDesc',
    label: 'Fecha doc. más reciente',
    sortBy: 'documentDate',
    sortDir: 'desc',
  },
  {
    value: 'documentDateAsc',
    label: 'Fecha doc. más antigua',
    sortBy: 'documentDate',
    sortDir: 'asc',
  },
];

const PAGE_SIZE = 10;

@Component({
  selector: 'app-document-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatBottomSheetModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    DocumentFormatIconComponent,
    DocumentCategoryPillComponent,
    DocumentRowActionsComponent,
    DocumentSearchBarComponent,
    DocumentFiltersPanelComponent,
    DocumentFilterChipsComponent,
    DocumentEmptyResultsComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    ButtonComponent,
    IconButtonComponent,
    SortTriggerComponent,
    SensitivityBadgeComponent,
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
})
export class DocumentListComponent implements OnInit {
  private readonly documentsService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly router = inject(Router);

  // ── Signals existentes ──────────────────────────────────────────────
  protected readonly loading = signal(false);
  protected readonly documents = signal<Document[]>([]);
  protected readonly totalDocuments = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly selectedSort = signal<SortOption>('createdAtDesc');
  protected readonly downloadingIds = signal(new Set<number>());

  // ── Signals de búsqueda y filtros (RF-03) ───────────────────────────
  protected readonly searchInput = signal('');
  protected readonly appliedSearchTerm = signal<string | null>(null);
  protected readonly searchError = signal<string | null>(null);
  protected readonly filtersDraft = signal<DocumentFilters>({ ...EMPTY_FILTERS });
  protected readonly appliedFilters = signal<DocumentFilters>({ ...EMPTY_FILTERS });
  protected readonly activeFiltersMeta = signal<ActiveFiltersDto | null>(null);
  protected readonly filtersPanelOpen = signal(false);
  protected readonly filterOptions = signal<FilterOptionsResponse | null>(null);
  protected readonly loadingFilterOptions = signal(false);
  protected readonly dateRangeError = signal<string | null>(null);

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly currentSortLabel = computed(() => this.currentSortConfig().label);

  protected readonly currentUser = computed(() => this.auth.currentUser());
  protected readonly role = computed(() => this.auth.currentUser()?.role ?? 'READER');

  protected readonly canUpload = computed(() => canUploadDocument(this.role()));
  protected readonly canSeeUploadedByFilter = computed(() => this.role() === 'ADMIN');
  protected readonly isEmpty = computed(() => !this.loading() && this.totalDocuments() === 0);

  protected readonly appliedFilterCount = computed(() => countActiveFilters(this.appliedFilters()));

  protected readonly chips = computed<FilterChipDescriptor[]>(() =>
    this.buildChips(this.appliedSearchTerm(), this.activeFiltersMeta(), this.appliedFilters()),
  );

  protected readonly showClearAll = computed(() => this.chips().length >= 2);

  protected readonly hasActiveSearch = computed(
    () => this.appliedSearchTerm() !== null || hasAnyFilter(this.appliedFilters()),
  );

  protected readonly emptyVariant = computed<'search' | 'filters' | 'combined' | null>(() => {
    if (this.loading() || this.totalDocuments() > 0) return null;
    const hasTerm = this.appliedSearchTerm() !== null;
    const hasFilter = hasAnyFilter(this.appliedFilters());
    if (hasTerm && hasFilter) return 'combined';
    if (hasTerm) return 'search';
    if (hasFilter) return 'filters';
    return null;
  });

  protected readonly searchResultLabel = computed(() => {
    const total = this.totalDocuments();
    const term = this.appliedSearchTerm();
    const hasFilter = hasAnyFilter(this.appliedFilters());
    const docWord = total === 1 ? 'documento' : 'documentos';
    if (term && hasFilter)
      return `Se encontraron ${total} ${docWord} para "${term}" con los filtros aplicados`;
    if (term) return `Se encontraron ${total} ${docWord} para "${term}"`;
    if (hasFilter) return `Se encontraron ${total} ${docWord} con los filtros aplicados`;
    return null;
  });

  protected readonly pageRangeLabel = computed(() => {
    const page = this.currentPage();
    const total = this.totalDocuments();
    if (total === 0) return '0 documentos';
    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);
    return `Mostrando ${from}–${to} de ${total} documentos`;
  });

  protected readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    const pages: (number | null)[] = [1];
    if (range[0] > 2) pages.push(null);
    pages.push(...range);
    if (range[range.length - 1] < total - 1) pages.push(null);
    pages.push(total);
    return pages;
  });

  private readonly docDateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  private readonly loadedAtFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  constructor() {
    effect(() => {
      if (this.searchInput()) this.searchError.set(null);
    });
  }

  ngOnInit(): void {
    this.loadDocuments();
    this.loadFilterOptions();
  }

  // ── Carga de datos ──────────────────────────────────────────────────

  protected loadDocuments(): void {
    const opt = this.currentSortConfig();
    const filters = this.appliedFilters();
    this.loading.set(true);

    const uploadedBy = this.canSeeUploadedByFilter()
      ? (filters.uploadedBy ?? undefined)
      : undefined;

    this.documentsService
      .list({
        page: this.currentPage(),
        size: PAGE_SIZE,
        sortBy: opt.sortBy,
        sortDir: opt.sortDir,
        q: this.appliedSearchTerm() ?? undefined,
        categoryId: filters.categoryId ?? undefined,
        responsibleArea: filters.responsibleArea ?? undefined,
        dateFrom: filters.dateFrom ?? undefined,
        dateTo: filters.dateTo ?? undefined,
        uploadedBy,
      })
      .subscribe({
        next: (res) => {
          this.documents.set(res.documents);
          this.totalDocuments.set(res.totalDocuments);
          this.totalPages.set(res.totalPages);
          this.activeFiltersMeta.set(res.activeFilters ?? null);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          const apiError = err.error as ApiError | undefined;
          this.notifications.error(
            'No se pudo cargar el listado',
            apiError?.message ?? 'Verifique su conexión e intente nuevamente.',
          );
        },
      });
  }

  private loadFilterOptions(): void {
    this.loadingFilterOptions.set(true);
    this.documentsService.filterOptions().subscribe({
      next: (opts) => {
        this.filterOptions.set(opts);
        this.loadingFilterOptions.set(false);
      },
      error: () => {
        this.loadingFilterOptions.set(false);
      },
    });
  }

  // ── Búsqueda (HU-20) ────────────────────────────────────────────────

  protected onSearchInputChange(value: string): void {
    this.searchInput.set(value);
  }

  protected onSearchSubmit(): void {
    const term = this.searchInput().trim();
    if (term.length > 0 && term.length < 2) {
      this.searchError.set('Ingrese al menos 2 caracteres para buscar.');
      return;
    }
    if (term.length > 100) {
      this.searchError.set('El texto de búsqueda no puede superar los 100 caracteres.');
      return;
    }
    this.searchError.set(null);
    this.appliedSearchTerm.set(term.length > 0 ? term : null);
    this.currentPage.set(1);
    this.loadDocuments();
  }

  protected onSearchClear(): void {
    this.searchInput.set('');
    this.searchError.set(null);
    this.appliedSearchTerm.set(null);
    this.currentPage.set(1);
    this.loadDocuments();
  }

  // ── Filtros (HU-21, HU-22) ──────────────────────────────────────────

  protected onToggleFiltersPanel(): void {
    if (window.innerWidth <= 768) {
      const ref = this.bottomSheet.open(DocumentFiltersBottomSheetComponent, {
        data: {
          draft: { ...this.appliedFilters() },
          options: this.filterOptions(),
          canSeeUploadedBy: this.canSeeUploadedByFilter(),
          loadingOptions: this.loadingFilterOptions(),
        },
        panelClass: 'filters-bottom-sheet',
      });
      ref.afterDismissed().subscribe((result: FiltersBottomSheetResult) => {
        if (result?.action === 'apply') {
          this.onFiltersApply(result.draft);
        }
      });
    } else {
      const willOpen = !this.filtersPanelOpen();
      if (willOpen) {
        this.filtersDraft.set({ ...this.appliedFilters() });
        this.dateRangeError.set(null);
      }
      this.filtersPanelOpen.set(willOpen);
    }
  }

  protected onDraftChange(draft: DocumentFilters): void {
    this.filtersDraft.set(draft);
    if (draft.dateFrom && draft.dateTo) {
      this.dateRangeError.set(this.validateDateRange(draft.dateFrom, draft.dateTo));
    } else {
      this.dateRangeError.set(null);
    }
  }

  protected onFiltersApply(draft: DocumentFilters): void {
    const rangeError = this.validateDateRange(draft.dateFrom, draft.dateTo);
    if (rangeError) {
      this.dateRangeError.set(rangeError);
      return;
    }
    this.dateRangeError.set(null);
    this.appliedFilters.set({ ...draft });
    this.currentPage.set(1);
    this.filtersPanelOpen.set(false);
    this.loadDocuments();
  }

  protected onFiltersReset(): void {
    this.filtersDraft.set({ ...EMPTY_FILTERS });
    this.dateRangeError.set(null);
  }

  protected onFiltersClose(): void {
    this.filtersPanelOpen.set(false);
    this.dateRangeError.set(null);
  }

  // ── Chips de filtros activos (HU-23) ────────────────────────────────

  protected onRemoveChip(key: FilterChipDescriptor['key']): void {
    if (key === 'q') {
      this.appliedSearchTerm.set(null);
      this.searchInput.set('');
    } else {
      this.appliedFilters.update((f) => ({ ...f, [key]: null }));
    }
    this.currentPage.set(1);
    this.loadDocuments();
  }

  protected onClearAll(): void {
    this.appliedSearchTerm.set(null);
    this.searchInput.set('');
    this.searchError.set(null);
    this.appliedFilters.set({ ...EMPTY_FILTERS });
    this.filtersDraft.set({ ...EMPTY_FILTERS });
    this.filtersPanelOpen.set(false);
    this.currentPage.set(1);
    this.loadDocuments();
  }

  // ── Ordenamiento y paginación ────────────────────────────────────────

  protected onSortChange(value: SortOption): void {
    this.selectedSort.set(value);
    this.currentPage.set(1);
    this.loadDocuments();
  }

  protected goToFirst(): void {
    if (this.currentPage() === 1) return;
    this.currentPage.set(1);
    this.loadDocuments();
  }

  protected goToPrev(): void {
    if (this.currentPage() <= 1) return;
    this.currentPage.update((p) => p - 1);
    this.loadDocuments();
  }

  protected goToNext(): void {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update((p) => p + 1);
    this.loadDocuments();
  }

  protected goToLast(): void {
    if (this.currentPage() === this.totalPages()) return;
    this.currentPage.set(this.totalPages());
    this.loadDocuments();
  }

  protected goToPage(page: number): void {
    if (page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadDocuments();
  }

  protected onView(doc: Document): void {
    this.router.navigate(['/documents', doc.id]);
  }

  protected onDownload(doc: Document): void {
    this.downloadingIds.update((ids) => new Set(ids).add(doc.id));

    this.documentsService.download(doc.id).subscribe({
      next: (response) => {
        const filename =
          parseFilenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
          buildFallbackFilename(doc.title, doc.fileFormat);
        triggerBlobDownload(response.body!, filename);
        this.notifications.success('Descarga iniciada', filename);
        this.downloadingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(doc.id);
          return next;
        });
      },
      error: async (err: HttpErrorResponse) => {
        this.downloadingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(doc.id);
          return next;
        });
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

  protected onEdit(doc: Document): void {
    this.documentsService.getById(doc.id).subscribe({
      next: (detail) => {
        const ref = this.dialog.open<
          EditDocumentMetadataDialogComponent,
          EditDocumentMetadataDialogData,
          EditDocumentMetadataDialogResult
        >(EditDocumentMetadataDialogComponent, {
          data: { document: detail },
          width: '620px',
          maxWidth: '95vw',
          autoFocus: 'first-tabbable',
        });
        ref.afterClosed().subscribe((result) => {
          if (result?.kind === 'updated') {
            this.loadDocuments();
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) return;
        if (err.status === 404) {
          this.notifications.error(
            'Documento no encontrado',
            'El documento ya no existe o fue eliminado.',
          );
          return;
        }
        this.notifications.error(
          'Error al abrir el editor',
          'No fue posible cargar los datos del documento. Intente nuevamente.',
        );
      },
    });
  }

  protected onDelete(doc: Document): void {
    const ref = this.dialog.open<
      DeleteDocumentDialogComponent,
      DeleteDocumentDialogData,
      DeleteDocumentDialogResult
    >(DeleteDocumentDialogComponent, {
      data: { document: doc },
      width: '480px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result?.success) return;
      this.notifications.success('Documento eliminado', result.message);
      this.reloadAfterDelete();
    });
  }

  protected onUploadSingle(): void {
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
        this.selectedSort.set('createdAtDesc');
        this.currentPage.set(1);
        this.loadDocuments();
      }
    });
  }

  protected onUploadBatch(): void {
    if (!this.canUpload()) return;
    const ref = this.dialog.open<
      UploadDocumentsBatchDialogComponent,
      UploadDocumentsBatchDialogData,
      UploadDocumentsBatchDialogResult
    >(UploadDocumentsBatchDialogComponent, {
      data: {},
      width: '720px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.kind === 'uploaded' && result.uploadedCount > 0) {
        this.selectedSort.set('createdAtDesc');
        this.currentPage.set(1);
        this.loadDocuments();
      }
    });
  }

  protected formatDocumentDate(iso: string): string {
    const d = this.parseDate(iso);
    return d ? this.docDateFormatter.format(d) : '—';
  }

  protected formatCreatedAt(iso: string): string {
    const d = this.parseDate(iso);
    return d ? this.loadedAtFormatter.format(d) : '—';
  }

  protected formatSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  protected userInitials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }

  protected trackById(_index: number, doc: Document): number {
    return doc.id;
  }

  private currentSortConfig(): SortOptionConfig {
    return SORT_OPTIONS.find((o) => o.value === this.selectedSort()) ?? SORT_OPTIONS[0];
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private reloadAfterDelete(): void {
    const isLastItemOnPage = this.documents().length === 1;
    if (isLastItemOnPage && this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
    }
    this.loadDocuments();
  }

  private validateDateRange(from: string | null, to: string | null): string | null {
    if (!from || !to) return null;
    return from > to ? 'La fecha de inicio no puede ser posterior a la fecha de fin.' : null;
  }

  private formatChipDate(ymd: string): string {
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }

  private buildChips(
    term: string | null,
    meta: ActiveFiltersDto | null,
    filters: DocumentFilters,
  ): FilterChipDescriptor[] {
    const chips: FilterChipDescriptor[] = [];
    if (term) {
      chips.push({ key: 'q', label: 'Búsqueda', value: `"${term}"`, kind: 'search' });
    }
    if (filters.categoryId !== null) {
      chips.push({
        key: 'categoryId',
        label: 'Categoría',
        value: meta?.categoryName ?? `#${filters.categoryId}`,
      });
    }
    if (filters.responsibleArea) {
      chips.push({ key: 'responsibleArea', label: 'Área', value: filters.responsibleArea });
    }
    if (filters.dateFrom) {
      chips.push({ key: 'dateFrom', label: 'Desde', value: this.formatChipDate(filters.dateFrom) });
    }
    if (filters.dateTo) {
      chips.push({ key: 'dateTo', label: 'Hasta', value: this.formatChipDate(filters.dateTo) });
    }
    if (filters.uploadedBy !== null) {
      chips.push({
        key: 'uploadedBy',
        label: 'Subido por',
        value: meta?.uploadedByName ?? `#${filters.uploadedBy}`,
      });
    }
    return chips;
  }
}
