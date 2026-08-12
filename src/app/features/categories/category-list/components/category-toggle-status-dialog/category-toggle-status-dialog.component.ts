import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AlertComponent } from '../../../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CategoriesService } from '../../../../../core/services/categories.service';
import { Category } from '../../../../../core/models/category.model';
import { CategoryStatus } from '../../../../../core/models/category-status.model';
import { UpdateCategoryStatusResponse } from '../../../../../core/models/category-list.models';

export type CategoryToggleAction = 'deactivate' | 'activate';

export interface CategoryToggleStatusDialogData {
  category: Category;
  action: CategoryToggleAction;
}

export interface CategoryToggleStatusDialogResult {
  success: true;
  message: string;
  categoryId: number;
  newStatus: CategoryStatus;
}

@Component({
  selector: 'app-category-toggle-status-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatIconModule, AlertComponent, ButtonComponent],
  templateUrl: './category-toggle-status-dialog.component.html',
  styleUrl: './category-toggle-status-dialog.component.scss',
})
export class CategoryToggleStatusDialogComponent {
  protected readonly data = inject<CategoryToggleStatusDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<
      MatDialogRef<
        CategoryToggleStatusDialogComponent,
        CategoryToggleStatusDialogResult | undefined
      >
    >(MatDialogRef);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorBlocksAction = signal(false);

  protected readonly isDeactivate = computed(() => this.data.action === 'deactivate');
  protected readonly title = computed(() =>
    this.isDeactivate() ? 'Desactivar categoría' : 'Reactivar categoría',
  );
  protected readonly headerIcon = computed(() => (this.isDeactivate() ? 'warning' : 'restart_alt'));
  protected readonly actionIcon = computed(() =>
    this.isDeactivate() ? 'delete_outline' : 'check',
  );
  protected readonly actionLabel = computed(() =>
    this.isDeactivate() ? 'Desactivar' : 'Activar categoría',
  );
  protected readonly actionVariant = computed<'warning' | 'primary'>(() =>
    this.isDeactivate() ? 'warning' : 'primary',
  );
  protected readonly documentCount = computed(() => this.data.category.documentCount);
  protected readonly showDocumentsCard = computed(
    () => this.isDeactivate() && this.data.category.documentCount > 0,
  );
  protected readonly actionDisabled = computed(() => this.loading() || this.errorBlocksAction());

  protected confirm(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.dialogRef.disableClose = true;

    const newStatus: CategoryStatus = this.isDeactivate() ? 'INACTIVE' : 'ACTIVE';

    this.categoriesService.updateStatus(this.data.category.id, newStatus).subscribe({
      next: (res: UpdateCategoryStatusResponse) => {
        this.dialogRef.close({
          success: true,
          message: res.message,
          categoryId: res.id,
          newStatus: res.status,
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.dialogRef.disableClose = false;
        this.handleError(err);
      },
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  private handleError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 400:
        this.errorMessage.set(
          'La categoría ya tiene este estado. Cierre el diálogo y recargue el listado.',
        );
        this.errorBlocksAction.set(true);
        break;
      case 403:
        this.errorMessage.set('No tiene permisos para realizar esta acción.');
        this.errorBlocksAction.set(true);
        break;
      case 404:
        this.errorMessage.set(
          'La categoría ya no existe. Cierre el diálogo y recargue el listado.',
        );
        this.errorBlocksAction.set(true);
        break;
      default:
        this.errorMessage.set('No fue posible actualizar el estado. Intente de nuevo.');
        this.errorBlocksAction.set(false);
    }
  }
}
