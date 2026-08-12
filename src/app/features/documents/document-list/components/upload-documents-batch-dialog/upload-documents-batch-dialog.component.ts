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
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
  BatchUploadDocumentResponse,
  MAX_AREA_LENGTH,
  MAX_BATCH_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_TITLE_LENGTH,
  RESPONSIBLE_AREAS,
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
import { BatchFileItem, BatchFileStatus } from './batch-file-item.model';
import { v4 as uuidv4 } from 'uuid';

export type UploadDocumentsBatchDialogData = Record<string, never>;

export type UploadDocumentsBatchDialogResult =
  | { kind: 'uploaded'; uploadedCount: number }
  | undefined;

type Phase = 'compose' | 'uploading' | 'done';

@Component({
  selector: 'app-upload-documents-batch-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    AlertComponent,
    ButtonComponent,
    DocumentFormatIconComponent,
    SensitivityLockBannerComponent,
    SensitivityInheritedBannerComponent,
    SensitivityRadioComponent,
    SensitivityMobileFieldComponent,
  ],
  templateUrl: './upload-documents-batch-dialog.component.html',
  styleUrl: './upload-documents-batch-dialog.component.scss',
})
export class UploadDocumentsBatchDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<UploadDocumentsBatchDialogComponent, UploadDocumentsBatchDialogResult>>(
      MatDialogRef,
    );
  protected readonly _data = inject<UploadDocumentsBatchDialogData>(MAT_DIALOG_DATA);

  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly documentsService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  protected readonly phase = signal<Phase>('compose');
  protected readonly files = signal<BatchFileItem[]>([]);
  protected readonly globalProgress = signal(0);
  protected readonly dragOver = signal(false);
  protected readonly fileError = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly categoriesLoading = signal(false);
  protected readonly categoriesLoadError = signal(false);

  protected readonly areas = RESPONSIBLE_AREAS;
  protected readonly maxBatchFiles = MAX_BATCH_FILES;
  protected readonly maxTitleLength = MAX_TITLE_LENGTH;

  protected readonly form = this.fb.group({
    categoryId: [null as number | null, [Validators.required]],
    responsibleArea: [
      '' as string | null,
      [Validators.required, Validators.maxLength(MAX_AREA_LENGTH)],
    ],
    sensitivityLevel: ['INTERNAL' as SensitivityLevel, [Validators.required]],
  });

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  private readonly categoryIdValue = toSignal(this.form.controls.categoryId.valueChanges, {
    initialValue: this.form.controls.categoryId.value,
  });

  protected readonly selectedCategory = computed(() =>
    this.categories().find((c) => c.id === this.categoryIdValue()),
  );
  protected readonly categoryDefault = computed(
    () => this.selectedCategory()?.defaultSensitivityLevel ?? 'INTERNAL',
  );
  protected readonly sensitivityLocked = computed(() => this.categoryDefault() !== 'INTERNAL');
  protected readonly editorRole = computed(() => this.auth.currentUser()?.role === 'EDITOR');

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

  protected readonly summary = computed(() => {
    const items = this.files();
    return {
      success: items.filter((f) => f.status === 'success').length,
      failed: items.filter((f) => f.status === 'error').length,
      total: items.length,
    };
  });

  protected readonly canSubmit = computed(
    () => this.formStatus() === 'VALID' && this.files().length > 0 && this.phase() === 'compose',
  );

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

  protected onFilesSelected(filesList: FileList | File[]): void {
    const incoming = Array.from(filesList);
    const current = this.files();

    if (current.length + incoming.length > MAX_BATCH_FILES) {
      this.fileError.set('Solo puede cargar hasta 5 archivos a la vez');
      return;
    }

    this.fileError.set(null);
    const valid: BatchFileItem[] = [];

    for (const file of incoming) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
        this.fileError.set(
          `"${file.name}" tiene un formato no permitido. Use PDF, DOCX, XLSX, JPG o PNG.`,
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        this.fileError.set(`"${file.name}" supera los 10 MB permitidos.`);
        continue;
      }
      valid.push({
        id: uuidv4(),
        file,
        title: file.name.replace(/\.[^.]+$/, '').slice(0, MAX_TITLE_LENGTH),
        status: 'pending',
        errorMessage: null,
        documentId: null,
      });
    }

    if (valid.length > 0) {
      this.files.update((items) => [...items, ...valid]);
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
    const filesList = event.dataTransfer?.files;
    if (filesList && filesList.length > 0) {
      this.onFilesSelected(filesList);
    }
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.onFilesSelected(input.files);
    }
    input.value = '';
  }

  protected removeFile(id: string): void {
    this.files.update((items) => items.filter((f) => f.id !== id));
    if (this.files().length === 0) {
      this.fileError.set(null);
    }
  }

  protected updateTitle(id: string, value: string): void {
    const trimmed = value.trim().slice(0, MAX_TITLE_LENGTH);
    this.files.update((items) =>
      items.map((f) => {
        if (f.id !== id) return f;
        const title = trimmed || f.file.name.replace(/\.[^.]+$/, '').slice(0, MAX_TITLE_LENGTH);
        return { ...f, title };
      }),
    );
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.files().length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitError.set(null);
    this.globalProgress.set(0);
    this.phase.set('uploading');
    this.form.disable();
    this.dialogRef.disableClose = true;
    this.files.update((items) =>
      items.map((f) => ({ ...f, status: 'uploading' as BatchFileStatus })),
    );

    const raw = this.form.getRawValue();
    const fd = new FormData();
    this.files().forEach((item) => fd.append('files', item.file, item.file.name));
    fd.append('categoryId', String(raw.categoryId));
    fd.append('responsibleArea', raw.responsibleArea ?? '');
    fd.append('sensitivityLevel', raw.sensitivityLevel!);
    this.files().forEach((item) => fd.append('titles', item.title.trim() || item.file.name));

    this.documentsService
      .createBatch(fd)
      .pipe(
        finalize(() => {
          this.form.enable();
          if (this.sensitivityLocked()) {
            this.form.controls.sensitivityLevel.disable({ emitEvent: false });
          }
          this.dialogRef.disableClose = false;
        }),
      )
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const total = event.total ?? 1;
            this.globalProgress.set(Math.round((event.loaded / total) * 100));
          } else if (event.type === HttpEventType.Response && event.body) {
            this.applyResults(event.body);
          }
        },
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  protected close(): void {
    const ok = this.summary().success;
    if (ok > 0) {
      this.dialogRef.close({ kind: 'uploaded', uploadedCount: ok });
    } else {
      this.dialogRef.close(undefined);
    }
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

  private applyResults(body: BatchUploadDocumentResponse): void {
    this.files.update((items) =>
      items.map((item, i) => {
        const result = body.results[i];
        if (!result) {
          return {
            ...item,
            status: 'error' as BatchFileStatus,
            errorMessage: 'Sin respuesta del servidor.',
          };
        }
        return {
          ...item,
          status: (result.success ? 'success' : 'error') as BatchFileStatus,
          documentId: result.documentId,
          errorMessage: result.errorMessage,
        };
      }),
    );
    this.globalProgress.set(100);

    if (body.totalSuccessful > 0) {
      this.notifications.success(
        'Carga finalizada',
        `${body.totalSuccessful} de ${body.totalReceived} archivos cargados correctamente.`,
      );
    }
    this.phase.set('done');
  }

  private handleError(err: HttpErrorResponse): void {
    this.phase.set('compose');
    this.files.update((items) =>
      items.map((f) => ({ ...f, status: 'pending' as BatchFileStatus })),
    );

    switch (err.status) {
      case 400:
        this.submitError.set(
          err.error?.message ?? 'Los datos del lote no son válidos. Revise el formulario.',
        );
        break;
      case 403:
        this.submitError.set('No tiene permisos para cargar documentos.');
        break;
      case 404:
        this.submitError.set('La categoría seleccionada no existe o está inactiva.');
        this.loadCategories();
        break;
      case 413:
        this.submitError.set('El tamaño total del lote excede el límite del servidor.');
        break;
      default:
        this.submitError.set(
          'No fue posible cargar los documentos. Intente nuevamente en unos momentos.',
        );
    }
  }
}
