import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ButtonComponent, ButtonVariant } from '@shared/components/button/button.component';
import { SensitivityRadioComponent } from '@shared/sensitivity/sensitivity-radio.component';
import { isActiveApprover } from '@core/auth/permissions';
import { CategoriesService } from '@core/services/categories.service';
import { NotificationService } from '@core/services/notification.service';
import { UsersService } from '@core/services/users.service';
import {
  Category,
  MAX_CATEGORY_DESCRIPTION_LENGTH,
  MAX_CATEGORY_NAME_LENGTH,
  MIN_CATEGORY_NAME_LENGTH,
} from '@core/models/category.model';
import { applyFieldErrors } from '@shared/forms/apply-field-errors';
import { trimmedMinLength } from '@shared/forms/validators';
import {
  SensitivityLevel,
  SENSITIVITY_LABELS,
  compareSensitivity,
} from '@core/models/sensitivity-level.model';
import {
  CreateCategoryRequest,
  CreateCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from '@core/models/category-list.model';
import { FieldErrorComponent } from '@shared/forms/field-error.component';
import { CATEGORY_FORM_MESSAGES } from './category-form.messages';

export type CategoryFormDialogMode = 'create' | 'edit';

// Con menos aprobadores, quien sube un documento no tiene otro aprobador que lo revise (HU-31).
const MIN_ACTIVE_APPROVERS = 2;

export interface CategoryFormDialogData {
  mode: CategoryFormDialogMode;
  category?: Category;
}

export type CategoryFormDialogResult =
  | { kind: 'created'; category: CreateCategoryResponse }
  | { kind: 'updated'; category: Category }
  | undefined;

@Component({
  selector: 'app-category-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FieldErrorComponent,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    MatSlideToggleModule,
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

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly categoriesService = inject(CategoriesService);
  private readonly usersService = inject(UsersService);
  private readonly notifications = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly confirmChecked = signal(false);

  private readonly previousLevel = signal<SensitivityLevel | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        trimmedMinLength(MIN_CATEGORY_NAME_LENGTH),
        Validators.maxLength(MAX_CATEGORY_NAME_LENGTH),
      ],
    ],
    description: ['', [Validators.maxLength(MAX_CATEGORY_DESCRIPTION_LENGTH)]],
    defaultSensitivityLevel: ['INTERNAL' as SensitivityLevel, [Validators.required]],
    // HU-31: en No por defecto al crear (FR-001).
    requiresApproval: [false],
  });

  private readonly nameValue = toSignal(this.form.controls.name.valueChanges, { initialValue: '' });
  private readonly descValue = toSignal(this.form.controls.description.valueChanges, {
    initialValue: '',
  });
  private readonly sensitivityValue = toSignal(
    this.form.controls.defaultSensitivityLevel.valueChanges,
    { initialValue: this.form.controls.defaultSensitivityLevel.value },
  );

  protected readonly requiresApprovalValue = toSignal(
    this.form.controls.requiresApproval.valueChanges,
    { initialValue: this.form.controls.requiresApproval.value },
  );

  /** Valor de "Requiere aprobación" antes de editar (`false` al crear). */
  private readonly originalRequiresApproval = this.data.category?.requiresApproval ?? false;

  /** Aprobadores activos; `null` mientras no se sabe (consulta en curso, fallida o no hecha). */
  private readonly activeApprovers = signal<number | null>(null);

  /** Advertencia no bloqueante al activar la aprobación con menos de dos aprobadores (FR-004). */
  protected readonly showApproverWarning = computed(
    () =>
      this.requiresApprovalValue() &&
      !this.originalRequiresApproval &&
      (this.activeApprovers() ?? MIN_ACTIVE_APPROVERS) < MIN_ACTIVE_APPROVERS,
  );

  protected readonly messages = CATEGORY_FORM_MESSAGES;
  protected readonly maxNameLength = MAX_CATEGORY_NAME_LENGTH;
  protected readonly maxDescriptionLength = MAX_CATEGORY_DESCRIPTION_LENGTH;

  protected readonly nameLen = computed(() => this.nameValue().length);
  protected readonly descLen = computed(() => this.descValue().length);

  protected readonly isEdit = computed(() => this.data.mode === 'edit');
  protected readonly title = computed(() =>
    this.isEdit()
      ? $localize`:@@categories.form.titleEdit:Editar categoría`
      : $localize`:@@categories.form.titleCreate:Nueva categoría`,
  );
  protected readonly loadingLabel = computed(() =>
    this.isEdit()
      ? $localize`:@@common.updating:Actualizando…`
      : $localize`:@@common.saving:Guardando…`,
  );

  protected readonly showDocumentBanner = computed(
    () => this.isEdit() && (this.data.category?.documentCount ?? 0) > 0,
  );
  protected readonly documentCount = computed(() => this.data.category?.documentCount ?? 0);

  protected readonly warningKind = computed<
    'edit-raise' | 'edit-lower' | 'create-sensitive' | null
  >(() => {
    const current = this.sensitivityValue() as SensitivityLevel;
    const prev = this.previousLevel();

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
  protected readonly levelLabelTo = computed(
    () => SENSITIVITY_LABELS[this.sensitivityValue() as SensitivityLevel] ?? '',
  );

  protected readonly primaryLabel = computed(() => {
    if (this.warningKind() === 'edit-raise') {
      return $localize`:@@categories.form.submitRaise:Guardar y actualizar documentos`;
    }
    if (this.isEdit()) return $localize`:@@common.saveChanges:Guardar cambios`;
    return $localize`:@@categories.form.submitCreate:Crear categoría`;
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
      const { name, description, defaultSensitivityLevel, requiresApproval } = this.data.category;
      this.form.patchValue({
        name,
        description: description ?? '',
        defaultSensitivityLevel: defaultSensitivityLevel ?? 'INTERNAL',
        requiresApproval,
      });
      this.previousLevel.set(defaultSensitivityLevel ?? 'INTERNAL');
    }
    if (!this.originalRequiresApproval) this.loadActiveApprovers();
  }

  /**
   * Cuenta los aprobadores activos solo si la aprobación se puede activar (research R3). Un error
   * se ignora: la advertencia es opcional y un toast de error confundiría en un formulario válido.
   */
  private loadActiveApprovers(): void {
    this.usersService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.activeApprovers.set(res.users.filter(isActiveApprover).length),
        error: () => this.activeApprovers.set(null),
      });
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

    const raw = this.form.getRawValue();
    const payload: CreateCategoryRequest | UpdateCategoryRequest = {
      name: raw.name.trim(),
      description: raw.description.trim() || null,
      defaultSensitivityLevel: raw.defaultSensitivityLevel,
      requiresApproval: raw.requiresApproval,
    };

    const request$ =
      this.isEdit() && this.data.category
        ? this.categoriesService.update(this.data.category.id, payload)
        : this.categoriesService.create(payload);

    request$
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => this.handleSuccess(res),
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
  }

  private handleSuccess(res: CreateCategoryResponse | UpdateCategoryResponse): void {
    if (this.isEdit() && this.data.category) {
      this.notifications.success(
        $localize`:@@categories.toast.updated.title:Categoría actualizada`,
        $localize`:@@users.toast.updated.description:Los cambios se guardaron correctamente.`,
      );
      if (res.requiresApproval !== this.originalRequiresApproval) {
        this.notifyApprovalScope(res.requiresApproval);
      }
      const updated: Category = {
        ...this.data.category,
        name: res.name,
        description: res.description,
        status: res.status,
        defaultSensitivityLevel: res.defaultSensitivityLevel,
        requiresApproval: res.requiresApproval,
      };
      this.dialogRef.close({ kind: 'updated', category: updated });
    } else {
      this.notifications.success(
        $localize`:@@categories.toast.created.title:Categoría creada`,
        $localize`:@@categories.toast.created.description:La categoría está disponible para clasificar documentos.`,
      );
      this.dialogRef.close({ kind: 'created', category: res as CreateCategoryResponse });
    }
  }

  /**
   * Aviso de alcance (HU-31, FR-003): va detrás del toast de éxito, encolado para no reemplazarlo.
   * El texto es el de la interfaz, no el `approvalScopeNotice` del backend (solo en español).
   */
  private notifyApprovalScope(requiresApproval: boolean): void {
    const title = requiresApproval
      ? $localize`:@@categories.toast.approvalOn.title:Aprobación activada`
      : $localize`:@@categories.toast.approvalOff.title:Aprobación desactivada`;
    this.notifications.info(
      title,
      $localize`:@@categories.toast.approvalScope.description:Este cambio solo afecta a los documentos que se carguen desde ahora. Los documentos existentes conservan su estado actual.`,
      { queue: true },
    );
  }

  private handleError(err: HttpErrorResponse): void {
    // Antes de aplicar errores: enable() vuelve a validar y borraría los del backend (R12).
    this.form.enable();
    this.dialogRef.disableClose = false;
    switch (err.status) {
      case HttpStatusCode.Conflict:
        this.submitError.set(
          $localize`:@@categories.form.error.duplicate:Ya existe una categoría con este nombre.`,
        );
        this.form.controls.name.setErrors({ duplicate: true });
        this.form.controls.name.markAsTouched();
        break;
      case HttpStatusCode.BadRequest:
        if (!applyFieldErrors(this.form, err)) {
          this.submitError.set(
            $localize`:@@common.error.invalidData:Los datos enviados no son válidos. Revise el formulario.`,
          );
        }
        break;
      case HttpStatusCode.Forbidden:
        this.submitError.set(
          this.isEdit()
            ? $localize`:@@categories.form.error.editForbidden:No es posible editar la categoría. Verifique sus permisos o que la categoría siga activa.`
            : $localize`:@@categories.form.error.createForbidden:No tiene permisos para crear categorías.`,
        );
        break;
      case HttpStatusCode.NotFound:
        this.submitError.set(
          $localize`:@@categories.form.error.notFound:La categoría ya no existe. Cierre el formulario y recargue el listado.`,
        );
        break;
      default:
        this.submitError.set(
          this.isEdit()
            ? $localize`:@@common.error.saveChanges:No fue posible guardar los cambios. Intente de nuevo.`
            : $localize`:@@categories.form.error.create:No fue posible crear la categoría. Intente de nuevo.`,
        );
    }
  }
}
