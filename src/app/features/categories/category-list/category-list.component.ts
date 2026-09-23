import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  CategoryFormDialogComponent,
  CategoryFormDialogData,
  CategoryFormDialogResult,
} from './components/category-form-dialog/category-form-dialog.component';
import {
  CategoryToggleStatusDialogComponent,
  CategoryToggleStatusDialogData,
  CategoryToggleStatusDialogResult,
} from './components/category-toggle-status-dialog/category-toggle-status-dialog.component';
import { CategoriesService } from '@core/services/categories.service';
import { NotificationService } from '@core/services/notification.service';
import { Category } from '@core/models/category.model';
import { CategorySortBy, CategorySortDir } from '@core/models/category-list.model';
import { CategoryStatusBadgeComponent } from './components/category-status-badge.component';
import { CategoryIconBadgeComponent } from './components/category-icon-badge.component';
import { CategoryRowActionsComponent } from './components/category-row-actions.component';
import { SensitivityBadgeComponent } from '@shared/sensitivity/sensitivity-badge.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SortTriggerComponent } from '@shared/components/sort-trigger/sort-trigger.component';
import { DatePipe } from '@angular/common';
import { DATE_FORMAT } from '@shared/utils/date-formats';
import { DIALOG_LG, DIALOG_SM } from '@shared/ui/dialog-sizes';

type SortOption = 'nameAsc' | 'nameDesc' | 'createdAtDesc' | 'createdAtAsc';

interface SortOptionConfig {
  value: SortOption;
  label: string;
  sortBy: CategorySortBy;
  sortDir: CategorySortDir;
}

const SORT_OPTIONS: SortOptionConfig[] = [
  { value: 'nameAsc', label: 'Nombre A–Z', sortBy: 'name', sortDir: 'asc' },
  { value: 'nameDesc', label: 'Nombre Z–A', sortBy: 'name', sortDir: 'desc' },
  { value: 'createdAtDesc', label: 'Más recientes', sortBy: 'createdAt', sortDir: 'desc' },
  { value: 'createdAtAsc', label: 'Más antiguos', sortBy: 'createdAt', sortDir: 'asc' },
];

@Component({
  selector: 'app-category-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    CategoryStatusBadgeComponent,
    CategoryIconBadgeComponent,
    CategoryRowActionsComponent,
    SensitivityBadgeComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    ButtonComponent,
    SortTriggerComponent,
  ],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  /** `switchMap` descarta la respuesta anterior si se cambia de orden rápido (R2). */
  private readonly reload$ = new Subject<void>();

  protected readonly loading = signal(false);
  protected readonly categories = signal<Category[]>([]);
  protected readonly totalCategories = signal(0);
  protected readonly activeCategories = signal(0);
  protected readonly inactiveCategories = signal(0);
  protected readonly selectedSort = signal<SortOption>('nameAsc');

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly currentSortLabel = computed(() => this.currentSortConfig().label);

  protected readonly dateFormat = DATE_FORMAT;

  ngOnInit(): void {
    this.reload$
      .pipe(
        switchMap(() => this.fetch()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.categories.set(res.categories);
        this.totalCategories.set(res.totalCategories);
        this.activeCategories.set(res.activeCategories);
        this.inactiveCategories.set(res.inactiveCategories);
        this.loading.set(false);
      });
    this.loadCategories();
  }

  protected loadCategories(): void {
    this.reload$.next();
  }

  /** Petición con el orden actual. Un error se notifica y no corta `reload$`. */
  private fetch() {
    const opt = this.currentSortConfig();
    this.loading.set(true);
    return this.categoriesService.list(opt.sortBy, opt.sortDir).pipe(
      catchError((err: unknown) => {
        this.loading.set(false);
        this.notifications.httpError(
          err,
          'No se pudo cargar el listado',
          'Verifique su conexión e intente nuevamente.',
        );
        return EMPTY;
      }),
    );
  }

  protected onSortChange(value: SortOption): void {
    this.selectedSort.set(value);
    this.loadCategories();
  }

  protected goToCreate(): void {
    const ref = this.dialog.open<
      CategoryFormDialogComponent,
      CategoryFormDialogData,
      CategoryFormDialogResult
    >(CategoryFormDialogComponent, {
      data: { mode: 'create' },
      ...DIALOG_LG,
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.kind === 'created') this.loadCategories();
      });
  }

  protected goToEdit(category: Category): void {
    const ref = this.dialog.open<
      CategoryFormDialogComponent,
      CategoryFormDialogData,
      CategoryFormDialogResult
    >(CategoryFormDialogComponent, {
      data: { mode: 'edit', category },
      ...DIALOG_LG,
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.kind === 'updated') this.loadCategories();
      });
  }

  protected onToggleStatus(category: Category): void {
    const action = category.status === 'ACTIVE' ? 'deactivate' : 'activate';

    const ref = this.dialog.open<
      CategoryToggleStatusDialogComponent,
      CategoryToggleStatusDialogData,
      CategoryToggleStatusDialogResult
    >(CategoryToggleStatusDialogComponent, {
      data: { category, action },
      ...DIALOG_SM,
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result?.success) return;
        this.notifications.success('Estado actualizado', result.message);
        this.loadCategories();
      });
  }

  protected isMuted(category: Category): boolean {
    return category.status === 'INACTIVE';
  }

  private currentSortConfig(): SortOptionConfig {
    return SORT_OPTIONS.find((o) => o.value === this.selectedSort()) ?? SORT_OPTIONS[0];
  }
}
