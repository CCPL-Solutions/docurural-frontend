import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AlertComponent } from '../../../../../shared/components/alert/alert.component';
import { ButtonComponent, ButtonVariant } from '../../../../../shared/components/button/button.component';
import { SensitivityRadioComponent } from '../../../../../shared/sensitivity/sensitivity-radio.component';
import { CategoriesService } from '../../../../../core/services/categories.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { Category } from '../../../../../core/models/category.model';
import {
  SensitivityLevel,
  SENSITIVITY_LABELS,
  compareSensitivity,
} from '../../../../../core/models/sensitivity-level.model';
import {
  CreateCategoryRequest,
  CreateCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from '../../../../../core/models/category-list.models';

export type CategoryFormDialogMode = 'create' | 'edit';

export interface CategoryFormDialogData {
  mode:      CategoryFormDialogMode;
  category?: Category;
}

export type CategoryFormDialogResult =
  | { kind: 'created'; category: CreateCategoryResponse }
  | { kind: 'updated'; category: Category }
  | undefined;

function trimmedMinLength(min: number): ValidatorFn {
  return (control) => {
    const value = ((control.value as string) ?? '').trim();
    return value.length >= min ? null : { minlength: { requiredLength: min, actualLength: value.length } };
  };
}

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    AlertComponent,
    ButtonComponent,
    SensitivityRadioComponent,
  ],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.scss',
})
export class CategoryFormDialogComponent implements OnInit {
  protected readonly data = inject<CategoryFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<CategoryFormDialogComponent, CategoryFormDialogResult>>(MatDialogRef);

  private readonly fb                = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly notifications     = inject(NotificationService);

  protected readonly loading        = signal(false);
  protected readonly submitError    = signal<string | null>(null);
  protected readonly confirmChecked = signal(false);

  private readonly previousLevel = signal<SensitivityLevel | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name:                    ['', [Validators.required, trimmedMinLength(3), Validators.maxLength(100)]],
    description:             ['', [Validators.maxLength(500)]],
    defaultSensitivityLevel: ['INTERNAL' as SensitivityLevel, [Validators.required]],
  });

  private readonly nameValue = toSignal(this.form.controls.name.valueChanges,        { initialValue: '' });
  private readonly descValue = toSignal(this.form.controls.description.valueChanges, { initialValue: '' });
  private readonly sensitivityValue = toSignal(
    this.form.controls.defaultSensitivityLevel.valueChanges,
    { initialValue: this.form.controls.defaultSensitivityLevel.value },
  );

  protected readonly nameLen = computed(() => this.nameValue().length);
  protected readonly descLen = computed(() => this.descValue().length);

  protected readonly isEdit       = computed(() => this.data.mode === 'edit');
  protected readonly title        = computed(() => this.isEdit() ? 'Editar categoría' : 'Nueva categoría');
  protected readonly loadingLabel = computed(() => this.isEdit() ? 'Actualizando...' : 'Guardando...');

  protected readonly showDocumentBanner = computed(
    () => this.isEdit() && (this.data.category?.documentCount ?? 0) > 0,
  );
  protected readonly documentCount = computed(() => this.data.category?.documentCount ?? 0);

  protected readonly warningKind = computed<'edit-raise' | 'edit-lower' | 'create-sensitive' | null>(() => {
    const current = this.sensitivityValue() as SensitivityLevel;
    const prev    = this.previousLevel();

    if (this.isEdit() && prev !== null && current !== prev) {
      const cmp = compareSensitivity(current, prev);
      if (cmp > 0) return 'edit-raise';
      if (cmp < 0) return 'edit-lower';
    }
    if (!this.isEdit() && current !== 'INTERNAL') return 'create-sensitive';
    return null;
  });

  protected readonly levelLabelFrom = computed(() => {
    const prev = this.previousLevel();
    return prev ? SENSITIVITY_LABELS[prev] : '';
  });
  protected readonly levelLabelTo = computed(() =>
    SENSITIVITY_LABELS[this.sensitivityValue() as SensitivityLevel] ?? '',
  );

  protected readonly primaryLabel = computed(() => {
    if (this.warningKind() === 'edit-raise') return 'Guardar y actualizar documentos';
    if (this.isEdit()) return 'Guardar cambios';
    return 'Crear categoría';
  });

  protected readonly primaryVariant = computed<ButtonVariant>(() =>
    this.warningKind() === 'edit-raise' ? 'warning' : 'primary',
  );

  protected readonly canSubmit = computed(() => {
    if (this.warningKind() === 'edit-raise') return this.confirmChecked();
    return true;
  });

  ngOnInit(): void {
    if (this.isEdit() && this.data.category) {
      const { name, description, defaultSensitivityLevel } = this.data.category;
      this.form.patchValue({
        name,
        description:             description ?? '',
        defaultSensitivityLevel: defaultSensitivityLevel ?? 'INTERNAL',
      });
      this.previousLevel.set(defaultSensitivityLevel ?? 'INTERNAL');
    }
  }

  protected nameError(): string | null {
    const ctrl = this.form.controls.name;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required'))                               return 'Ingrese el nombre de la categoría.';
    if (ctrl.hasError('minlength') || ctrl.hasError('maxlength'))
      return 'El nombre debe tener entre 3 y 100 caracteres.';
    if (ctrl.hasError('backend'))                                return ctrl.getError('backend') as string;
    return null;
  }

  protected descriptionError(): string | null {
    const ctrl = this.form.controls.description;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('maxlength')) return 'La descripción no puede superar los 500 caracteres.';
    if (ctrl.hasError('backend'))   return ctrl.getError('backend') as string;
    return null;
  }

  protected sensitivityError(): string | null {
    const ctrl = this.form.controls.defaultSensitivityLevel;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required'))  return 'Seleccione el nivel de sensibilidad por defecto.';
    if (ctrl.hasError('backend'))   return ctrl.getError('backend') as string;
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.canSubmit()) return;
    this.executeSubmit();
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private executeSubmit(): void {
    this.loading.set(true);
    this.submitError.set(null);
    this.form.disable();
    this.dialogRef.disableClose = true;

    const raw     = this.form.getRawValue();
    const payload: CreateCategoryRequest | UpdateCategoryRequest = {
      name:                    raw.name.trim(),
      description:             raw.description.trim() || null,
      defaultSensitivityLevel: raw.defaultSensitivityLevel,
    };

    const request$ = this.isEdit() && this.data.category
      ? this.categoriesService.update(this.data.category.id, payload)
      : this.categoriesService.create(payload);

    request$.pipe(
      finalize(() => {
        this.loading.set(false);
        this.form.enable();
        this.dialogRef.disableClose = false;
      }),
    ).subscribe({
      next:  (res) => this.handleSuccess(res),
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  private handleSuccess(res: CreateCategoryResponse | UpdateCategoryResponse): void {
    if (this.isEdit() && this.data.category) {
      this.notifications.success('Categoría actualizada', 'Los cambios se guardaron correctamente.');
      const updated: Category = {
        ...this.data.category,
        name:                    res.name,
        description:             res.description,
        status:                  res.status,
        defaultSensitivityLevel: res.defaultSensitivityLevel,
      };
      this.dialogRef.close({ kind: 'updated', category: updated });
    } else {
      this.notifications.success('Categoría creada', 'La categoría está disponible para clasificar documentos.');
      this.dialogRef.close({ kind: 'created', category: res as CreateCategoryResponse });
    }
  }

  private handleError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 409:
        this.submitError.set('Ya existe una categoría con este nombre.');
        this.form.controls.name.setErrors({ duplicate: true });
        this.form.controls.name.markAsTouched();
        break;
      case 400:
        if (err.error?.fieldErrors) {
          const fieldErrors = err.error.fieldErrors as Record<string, string>;
          Object.entries(fieldErrors).forEach(([field, msg]) => {
            const ctrl = this.form.get(field);
            if (ctrl) {
              ctrl.setErrors({ backend: msg });
              ctrl.markAsTouched();
            }
          });
        } else {
          this.submitError.set('Los datos enviados no son válidos. Revise el formulario.');
        }
        break;
      case 403:
        this.submitError.set(
          this.isEdit()
            ? 'No es posible editar la categoría. Verifique sus permisos o que la categoría siga activa.'
            : 'No tiene permisos para crear categorías.',
        );
        break;
      case 404:
        this.submitError.set('La categoría ya no existe. Cierre el formulario y recargue el listado.');
        break;
      default:
        this.submitError.set(
          this.isEdit()
            ? 'No fue posible guardar los cambios. Intente de nuevo.'
            : 'No fue posible crear la categoría. Intente de nuevo.',
        );
    }
  }
}
