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
import { DocumentFormat } from '../../../../../core/models/document-format.model';
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  RESPONSIBLE_AREAS,
  UploadDocumentResponse,
} from '../../../../../core/models/upload-document.models';
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

export type UploadDocumentDialogData = Record<string, never>;

export type UploadDocumentDialogResult =
  | { kind: 'uploaded'; document: UploadDocumentResponse }
  | undefined;

@Component({
  selector: 'app-upload-document-dialog',
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
  templateUrl: './upload-document-dialog.component.html',
  styleUrl: './upload-document-dialog.component.scss',
})
export class UploadDocumentDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<UploadDocumentDialogComponent, UploadDocumentDialogResult>>(MatDialogRef);
  private readonly _data = inject<UploadDocumentDialogData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly documentsService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly dragOver = signal(false);
  protected readonly categories = signal<Category[]>([]);
  protected readonly categoriesLoading = signal(false);
  protected readonly categoriesLoadError = signal(false);
  protected readonly titleAutoFilled = signal(false);

  protected readonly areas = RESPONSIBLE_AREAS;

  protected readonly form = this.fb.group({
    title: ['' as string | null, [Validators.required, Validators.maxLength(255)]],
    categoryId: [null as number | null, [Validators.required]],
    responsibleArea: ['' as string | null, [Validators.required, Validators.maxLength(100)]],
    documentDate: [null as Date | null, [Validators.required]],
    description: ['' as string | null, [Validators.maxLength(500)]],
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

  protected readonly selectedCategory = computed(() =>
    this.categories().find((c) => c.id === this.categoryIdValue()),
  );
  protected readonly categoryDefault = computed(
    () => this.selectedCategory()?.defaultSensitivityLevel ?? 'INTERNAL',
  );
  protected readonly sensitivityLocked = computed(() => this.categoryDefault() !== 'INTERNAL');
  protected readonly editorRole = computed(() => this.auth.currentUser()?.role === 'EDITOR');
  protected readonly minSensitivity = computed(() => this.categoryDefault());

  constructor() {
    effect(() => {
      const locked = this.sensitivityLocked();
      const catDefault = this.categoryDefault();
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
          if (!isAtLeast(current, catDefault)) {
            ctrl.setValue(clampToMin(current, catDefault), { emitEvent: false });
          }
        }
      }
      ctrl.markAsPristine();
    });
  }

  ngOnInit(): void {
    this.loadCategories();
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

  protected onFileSelected(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      this.fileError.set('Formato no permitido. Use PDF, DOCX, XLSX, JPG o PNG.');
      this.selectedFile.set(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.fileError.set('El archivo supera los 10 MB permitidos.');
      this.selectedFile.set(null);
      return;
    }
    this.fileError.set(null);
    this.selectedFile.set(file);

    const titleCtrl = this.form.controls.title;
    if (!titleCtrl.value?.trim() && !titleCtrl.dirty) {
      const autoName = file.name.replace(/\.[^.]+$/, '').slice(0, 255);
      titleCtrl.setValue(autoName);
      titleCtrl.markAsPristine();
      this.titleAutoFilled.set(true);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(): void {
    this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.onFileSelected(file);
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.onFileSelected(file);
    input.value = '';
  }

  protected removeFile(): void {
    this.selectedFile.set(null);
    this.fileError.set(null);
    if (this.titleAutoFilled()) {
      this.form.controls.title.setValue('');
      this.titleAutoFilled.set(false);
    }
  }

  protected onTitleInput(): void {
    this.titleAutoFilled.set(false);
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
    if (this.form.invalid || !this.selectedFile()) {
      this.form.markAllAsTouched();
      if (!this.selectedFile()) {
        this.fileError.set('Seleccione un archivo para continuar.');
      }
      return;
    }

    this.loading.set(true);
    this.submitError.set(null);
    this.form.disable();
    this.dialogRef.disableClose = true;

    const raw = this.form.getRawValue();
    const fd = new FormData();
    fd.append('file', this.selectedFile()!);
    fd.append('title', (raw.title ?? '').trim());
    fd.append('categoryId', String(raw.categoryId));
    fd.append('responsibleArea', raw.responsibleArea ?? '');
    fd.append('documentDate', formatYmd(raw.documentDate!));
    fd.append('sensitivityLevel', raw.sensitivityLevel!);
    const desc = (raw.description ?? '').trim();
    if (desc) fd.append('description', desc);

    this.documentsService
      .create(fd)
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

  protected inferFormat(filename: string): DocumentFormat {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'PDF';
      case 'docx':
        return 'DOCX';
      case 'xlsx':
        return 'XLSX';
      case 'jpg':
      case 'jpeg':
        return 'JPG';
      case 'png':
        return 'PNG';
      default:
        return 'PDF';
    }
  }

  protected formatSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  private handleSuccess(res: UploadDocumentResponse): void {
    this.notifications.success('Documento cargado', `"${res.title}" se subió correctamente.`);
    this.dialogRef.close({ kind: 'uploaded', document: res });
  }

  private handleError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 400:
        if (err.error?.fieldErrors) {
          const fieldErrors = err.error.fieldErrors as Record<string, string>;
          Object.entries(fieldErrors).forEach(([field, msg]) => {
            if (field === 'file') {
              this.fileError.set(msg);
            } else {
              const ctrl = this.form.get(field);
              if (ctrl) {
                ctrl.setErrors({ backend: msg });
                ctrl.markAsTouched();
              }
            }
          });
        } else {
          this.submitError.set(
            err.error?.message ?? 'Los datos enviados no son válidos. Revise el formulario.',
          );
        }
        break;
      case 403:
        this.submitError.set('No tiene permisos para cargar documentos.');
        break;
      case 404:
        this.submitError.set(
          'La categoría seleccionada ya no existe o está inactiva. Cierre el formulario y vuelva a intentarlo.',
        );
        break;
      case 413:
        this.fileError.set('El archivo supera los 10 MB permitidos.');
        break;
      case 415:
        this.fileError.set('Formato no permitido. Solo se aceptan PDF, DOCX, XLSX, JPG y PNG.');
        break;
      default:
        this.submitError.set(
          'No fue posible cargar el documento. Intente nuevamente en unos momentos.',
        );
    }
  }
}
