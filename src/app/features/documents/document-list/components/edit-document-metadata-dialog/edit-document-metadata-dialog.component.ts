import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AlertComponent } from '../../../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DocumentFormatIconComponent } from '../document-format-icon.component';
import { CategoriesService } from '../../../../../core/services/categories.service';
import { DocumentsService } from '../../../../../core/services/documents.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { Category } from '../../../../../core/models/category.model';
import { DocumentDetailResponse } from '../../../../../core/models/document-detail.model';
import { RESPONSIBLE_AREAS } from '../../../../../core/models/upload-document.models';
import {
  UpdateDocumentMetadataRequest,
  UpdateDocumentMetadataResponse,
} from '../../../../../core/models/update-document.models';
import {
  SensitivityLevel,
  clampToMin,
  isAtLeast,
} from '../../../../../core/models/sensitivity-level.model';
import { SensitivityLockBannerComponent } from '../../../../../shared/sensitivity/sensitivity-lock-banner.component';
import { SensitivityInheritedBannerComponent } from '../../../../../shared/sensitivity/sensitivity-inherited-banner.component';
import { SensitivityRadioComponent } from '../../../../../shared/sensitivity/sensitivity-radio.component';
import { SensitivityMobileFieldComponent } from '../../../../../shared/sensitivity/sensitivity-mobile-field.component';
import { formatFileSize } from '../../utils/file-size';
import { formatYmd } from '../../utils/format-ymd';

const MY_DATE_FORMATS = {
  parse: {
    dateInput: { day: 'numeric', month: 'numeric', year: 'numeric' },
  },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

export interface EditDocumentMetadataDialogData {
  document: DocumentDetailResponse;
}

export type EditDocumentMetadataDialogResult =
  | { kind: 'updated'; document: UpdateDocumentMetadataResponse }
  | undefined;

@Component({
  selector: 'app-edit-document-metadata-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatSelectModule,
    AlertComponent,
    ButtonComponent,
    DocumentFormatIconComponent,
    SensitivityLockBannerComponent,
    SensitivityInheritedBannerComponent,
    SensitivityRadioComponent,
    SensitivityMobileFieldComponent,
  ],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }],
  templateUrl: './edit-document-metadata-dialog.component.html',
  styleUrl: './edit-document-metadata-dialog.component.scss',
})
export class EditDocumentMetadataDialogComponent implements OnInit {
  protected readonly data = inject<EditDocumentMetadataDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<EditDocumentMetadataDialogComponent, EditDocumentMetadataDialogResult>>(
      MatDialogRef,
    );

  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly documentsService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly categoriesLoading = signal(false);
  protected readonly categoriesLoadError = signal(false);

  protected readonly areas = RESPONSIBLE_AREAS;

  protected readonly form = this.fb.group({
    title: ['' as string, [Validators.required, Validators.maxLength(255)]],
    categoryId: [null as number | null, [Validators.required]],
    responsibleArea: ['' as string, [Validators.required, Validators.maxLength(100)]],
    documentDate: [null as Date | null, [Validators.required]],
    description: ['' as string, [Validators.maxLength(500)]],
    sensitivityLevel: ['INTERNAL' as SensitivityLevel, [Validators.required]],
  });

  private readonly titleValue = toSignal(this.form.controls.title.valueChanges, {
    initialValue: '',
  });
  private readonly descValue = toSignal(this.form.controls.description.valueChanges, {
    initialValue: '',
  });
  private readonly categoryIdValue = toSignal(this.form.controls.categoryId.valueChanges, {
    initialValue: this.form.controls.categoryId.value,
  });

  protected readonly titleLen = computed(() => (this.titleValue() ?? '').length);
  protected readonly descLen = computed(() => (this.descValue() ?? '').length);

  private readonly docOriginalSensitivity = signal<SensitivityLevel>('INTERNAL');

  protected readonly selectedCategory = computed(() =>
    this.categories().find((c) => c.id === this.categoryIdValue()),
  );
  protected readonly categoryDefault = computed(
    () => this.selectedCategory()?.defaultSensitivityLevel ?? 'INTERNAL',
  );
  protected readonly sensitivityLocked = computed(() => this.categoryDefault() !== 'INTERNAL');
  protected readonly editorRole = computed(() => this.auth.currentUser()?.role === 'EDITOR');
  protected readonly minSensitivity = computed(() => {
    const catMin = this.categoryDefault();
    const docMin = this.docOriginalSensitivity();
    if (this.editorRole()) {
      return isAtLeast(catMin, docMin) ? catMin : docMin;
    }
    return catMin;
  });

  constructor() {
    effect(() => {
      const locked = this.sensitivityLocked();
      const catDefault = this.categoryDefault();
      const min = this.minSensitivity();
      const ctrl = this.form.controls.sensitivityLevel;
      if (locked) {
        ctrl.setValue(catDefault, { emitEvent: false });
        ctrl.disable({ emitEvent: false });
      } else {
        const wasLocked = ctrl.disabled;
        ctrl.enable({ emitEvent: false });
        if (wasLocked) {
          ctrl.setValue(catDefault, { emitEvent: false });
        } else {
          const current = (ctrl.value as SensitivityLevel | null) ?? 'INTERNAL';
          if (!isAtLeast(current, min)) {
            ctrl.setValue(clampToMin(current, min), { emitEvent: false });
          }
        }
      }
      ctrl.markAsPristine();
    });
  }

  protected readonly formatFileSize = formatFileSize;

  private readonly createdAtFormatter = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  ngOnInit(): void {
    this.loadCategories();
    const doc = this.data.document;
    this.docOriginalSensitivity.set(doc.sensitivityLevel);
    this.form.patchValue({
      title: doc.title,
      categoryId: doc.category.id,
      responsibleArea: doc.responsibleArea,
      documentDate: new Date(doc.documentDate + 'T00:00:00'),
      description: doc.description ?? '',
      sensitivityLevel: doc.sensitivityLevel,
    });
  }

  protected loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesLoadError.set(false);
    this.categoriesService
      .list('name', 'asc')
      .pipe(finalize(() => this.categoriesLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.categories.set(res.categories.filter((c) => c.status === 'ACTIVE'));
        },
        error: () => {
          this.categoriesLoadError.set(true);
        },
      });
  }

  protected formatCreatedAt(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : this.createdAtFormatter.format(d);
  }

  protected titleError(): string | null {
    const ctrl = this.form.controls.title;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'El título es obligatorio.';
    if (ctrl.hasError('maxlength')) return 'El título no puede superar los 255 caracteres.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected categoryError(): string | null {
    const ctrl = this.form.controls.categoryId;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'Seleccione una categoría.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected areaError(): string | null {
    const ctrl = this.form.controls.responsibleArea;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'El área responsable es obligatoria.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected dateError(): string | null {
    const ctrl = this.form.controls.documentDate;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'La fecha del documento es obligatoria.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected descriptionError(): string | null {
    const ctrl = this.form.controls.description;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('maxlength')) return 'La descripción no puede superar los 500 caracteres.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected sensitivityError(): string | null {
    const ctrl = this.form.controls.sensitivityLevel;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required'))
      return 'Debe seleccionar el nivel de sensibilidad del documento.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.submitError.set(null);
    this.form.disable();
    this.dialogRef.disableClose = true;

    const raw = this.form.getRawValue();
    const desc = (raw.description ?? '').trim();
    const payload: UpdateDocumentMetadataRequest = {
      title: (raw.title ?? '').trim(),
      categoryId: raw.categoryId!,
      responsibleArea: raw.responsibleArea ?? '',
      documentDate: formatYmd(raw.documentDate!),
      sensitivityLevel: raw.sensitivityLevel!,
      ...(desc ? { description: desc } : {}),
    };

    this.documentsService
      .update(this.data.document.id, payload)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.form.enable();
          if (this.sensitivityLocked()) {
            this.form.controls.sensitivityLevel.disable({ emitEvent: false });
          }
          this.dialogRef.disableClose = false;
        }),
      )
      .subscribe({
        next: (res) => this.handleSuccess(res),
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private handleSuccess(res: UpdateDocumentMetadataResponse): void {
    this.notifications.success(
      'Metadatos actualizados',
      res.message ?? 'Los cambios se guardaron correctamente.',
    );
    this.dialogRef.close({ kind: 'updated', document: res });
  }

  private handleError(err: HttpErrorResponse): void {
    switch (err.status) {
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
          this.submitError.set(
            err.error?.message ?? 'Los datos enviados no son válidos. Revise el formulario.',
          );
        }
        break;
      case 403:
        this.submitError.set('No tiene permisos para editar este documento.');
        break;
      case 404:
        this.submitError.set(
          'El documento ya no existe o fue eliminado. Cierre el formulario y recargue el listado.',
        );
        break;
      default:
        this.submitError.set('No fue posible guardar los cambios. Intente de nuevo.');
    }
  }
}
