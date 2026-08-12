import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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
import { CategoriesService } from '../../../core/services/categories.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Category } from '../../../core/models/category.model';
import { ApiError } from '../../../core/models/api-error.model';
import { CategorySortBy, CategorySortDir } from '../../../core/models/category-list.models';
import { CategoryStatusBadgeComponent } from './components/category-status-badge.component';
import { CategoryIconBadgeComponent } from './components/category-icon-badge.component';
import { CategoryRowActionsComponent } from './components/category-row-actions.component';
import { SensitivityBadgeComponent } from '../../../shared/sensitivity/sensitivity-badge.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SortTriggerComponent } from '../../../shared/components/sort-trigger/sort-trigger.component';

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
export class CategoryListComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  protected readonly loading = signal(false);
  protected readonly categories = signal<Category[]>([]);
  protected readonly totalCategories = signal(0);
  protected readonly activeCategories = signal(0);
  protected readonly inactiveCategories = signal(0);
  protected readonly selectedSort = signal<SortOption>('nameAsc');

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly currentSortLabel = computed(() => this.currentSortConfig().label);

  private readonly dateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  constructor() {
    this.loadCategories();
  }

  protected loadCategories(): void {
    const opt = this.currentSortConfig();
    this.loading.set(true);
    this.categoriesService.list(opt.sortBy, opt.sortDir).subscribe({
      next: (res) => {
        this.categories.set(res.categories);
        this.totalCategories.set(res.totalCategories);
        this.activeCategories.set(res.activeCategories);
        this.inactiveCategories.set(res.inactiveCategories);
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
      width: '620px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((result) => {
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
      width: '620px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((result) => {
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
      width: '400px',
      maxWidth: '90vw',
      autoFocus: 'first-tabbable',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result?.success) return;
      this.notifications.success('Estado actualizado', result.message);
      this.loadCategories();
    });
  }

  protected formatCreated(iso: string): string {
    const d = this.parseIso(iso);
    return d ? this.dateFormatter.format(d) : '—';
  }

  protected isMuted(category: Category): boolean {
    return category.status === 'INACTIVE';
  }

  protected trackById(_index: number, category: Category): number {
    return category.id;
  }

  private currentSortConfig(): SortOptionConfig {
    return SORT_OPTIONS.find((o) => o.value === this.selectedSort()) ?? SORT_OPTIONS[0];
  }

  private parseIso(value: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
}
