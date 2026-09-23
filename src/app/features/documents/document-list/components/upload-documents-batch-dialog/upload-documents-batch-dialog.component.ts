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
import { toApiError } from '@shared/http/api-error';
import { injectActiveCategories } from '@features/documents/dialogs/active-categories';
import { syncSensitivityWithCategory } from '@features/documents/dialogs/sensitivity-sync';
import { HttpErrorResponse, HttpEventType, HttpStatusCode } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { DocumentFormatIconComponent } from '@shared/components/document-format-icon/document-format-icon.component';
import { DocumentsService } from '@core/services/documents.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import {
  ALLOWED_EXTENSIONS,
  BatchUploadDocumentResponse,
  MAX_AREA_LENGTH,
  MAX_BATCH_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_TITLE_LENGTH,
  RESPONSIBLE_AREAS,
} from '@core/models/upload-document.model';
import { SensitivityLevel } from '@core/models/sensitivity-level.model';
import { SensitivityLockBannerComponent } from '@shared/sensitivity/sensitivity-lock-banner.component';
import { SensitivityInheritedBannerComponent } from '@shared/sensitivity/sensitivity-inherited-banner.component';
import { SensitivityRadioComponent } from '@shared/sensitivity/sensitivity-radio.component';
import { SensitivityMobileFieldComponent } from '@shared/sensitivity/sensitivity-mobile-field.component';
import { formatFileSize } from '@shared/utils/file-size';
import { BatchFileItem, BatchFileStatus } from './batch-file-item.model';
import { v4 as uuidv4 } from 'uuid';
import { isEditor } from '@core/auth/permissions';
import { inferFormat } from '@shared/utils/document-format';
import { FieldErrorComponent } from '@shared/forms/field-error.component';
import {
  DOCUMENT_FORM_LABELS,
  DOCUMENT_FORM_MESSAGES,
} from '@features/documents/dialogs/document-form.messages';

export type UploadDocumentsBatchDialogData = Record<string, never>;

export type UploadDocumentsBatchDialogResult =
  | { kind: 'uploaded'; uploadedCount: number }
  | undefined;

type Phase = 'compose' | 'uploading' | 'done';

@Component({
  selector: 'app-upload-documents-batch-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FieldErrorComponent,
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

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentsService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  protected readonly phase = signal<Phase>('compose');
  protected readonly files = signal<BatchFileItem[]>([]);
  protected readonly globalProgress = signal(0);
  protected readonly dragOver = signal(false);
  protected readonly fileError = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);
  private readonly activeCategories = injectActiveCategories();
  protected readonly categories = this.activeCategories.categories;
  protected readonly loadingCategories = this.activeCategories.loading;
  protected readonly loadCategoriesError = this.activeCategories.loadError;

  protected readonly areas = RESPONSIBLE_AREAS;
  protected readonly maxBatchFiles = MAX_BATCH_FILES;
  protected readonly maxTitleLength = MAX_TITLE_LENGTH;

  protected readonly messages = DOCUMENT_FORM_MESSAGES;
  protected readonly labels = DOCUMENT_FORM_LABELS;

  protected readonly form = this.fb.nonNullable.group({
    categoryId: [null as number | null, [Validators.required]],
    responsibleArea: ['', [Validators.required, Validators.maxLength(MAX_AREA_LENGTH)]],
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
  protected readonly editorRole = computed(() => isEditor(this.auth.currentUser()?.role));

  constructor() {
    syncSensitivityWithCategory(this.form.controls.sensitivityLevel, this.categoryDefault);
  }

  protected readonly summary = computed(() => {
    const items = this.files();
    return {
      success: items.filter((f) => f.status === 'success').length,
      failed: items.filter((f) => f.status === 'error').length,
      total: items.length,
    };
  });

  protected readonly dropzoneAriaLabel = computed(() => {
    const remaining = this.maxBatchFiles - this.files().length;
    return this.files().length === 0
      ? $localize`:@@documents.batch.dropzone.ariaLabel:Zona de carga. Haga clic o arrastre archivos aquí.`
      : $localize`:@@documents.batch.dropzone.addMoreAriaLabel:Agregar más archivos. Puede añadir ${remaining}:remaining: más.`;
  });

  protected titleAriaLabel(fileName: string): string {
    return $localize`:@@documents.batch.titleAriaLabel:Título para ${fileName}:fileName:`;
  }

  protected progressAriaLabel(fileName: string): string {
    return $localize`:@@documents.batch.progressAriaLabel:Progreso de carga de ${fileName}:fileName:`;
  }

  protected removeAriaLabel(fileName: string): string {
    return $localize`:@@documents.batch.removeAriaLabel:Quitar ${fileName}:fileName:`;
  }

  protected readonly canSubmit = computed(
    () => this.formStatus() === 'VALID' && this.files().length > 0 && this.phase() === 'compose',
  );

  ngOnInit(): void {
    this.loadCategories();
  }

  protected loadCategories(): void {
    this.activeCategories.load();
  }

  protected onFilesSelected(filesList: FileList | File[]): void {
    const incoming = Array.from(filesList);
    const current = this.files();

    if (current.length + incoming.length > MAX_BATCH_FILES) {
      this.fileError.set(
        $localize`:@@documents.batch.error.tooMany:Solo puede cargar hasta ${MAX_BATCH_FILES}:max: archivos a la vez.`,
      );
      return;
    }

    this.fileError.set(null);
    const valid: BatchFileItem[] = [];

    for (const file of incoming) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
        this.fileError.set(
          $localize`:@@documents.batch.error.format:"${file.name}:fileName:" tiene un formato no permitido. Use PDF, DOCX, XLSX, JPG o PNG.`,
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        this.fileError.set(
          $localize`:@@documents.batch.error.size:"${file.name}:fileName:" supera los 10 MB permitidos.`,
        );
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
    fd.append('responsibleArea', raw.responsibleArea);
    fd.append('sensitivityLevel', raw.sensitivityLevel);
    this.files().forEach((item) => fd.append('titles', item.title.trim() || item.file.name));

    this.documentsService
      .createBatch(fd)
      .pipe(
        finalize(() => (this.dialogRef.disableClose = false)),
        takeUntilDestroyed(this.destroyRef),
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

  protected readonly inferFormat = inferFormat;

  protected formatSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  private applyResults(body: BatchUploadDocumentResponse): void {
    this.files.update((items) =>
      items.map((item, i) => {
        const result = body.results[i];
        if (!result) {
          return {
            ...item,
            status: 'error' as BatchFileStatus,
            errorMessage: $localize`:@@documents.batch.error.noResponse:Sin respuesta del servidor.`,
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
        $localize`:@@documents.batch.toast.title:Carga finalizada`,
        $localize`:@@documents.batch.toast.description:${body.totalSuccessful}:success: de ${body.totalReceived}:total: archivos cargados correctamente.`,
      );
    }
    this.phase.set('done');
  }

  /** Deja el formulario editable tras un error (la sensibilidad sigue bloqueada si procede). */
  private unlockForm(): void {
    this.form.enable();
    if (this.sensitivityLocked()) {
      this.form.controls.sensitivityLevel.disable({ emitEvent: false });
    }
    this.dialogRef.disableClose = false;
  }

  private handleError(err: HttpErrorResponse): void {
    // Antes de aplicar errores: enable() vuelve a validar y borraría los del backend (R12).
    this.unlockForm();
    this.phase.set('compose');
    this.files.update((items) =>
      items.map((f) => ({ ...f, status: 'pending' as BatchFileStatus })),
    );

    switch (err.status) {
      case HttpStatusCode.BadRequest:
        this.submitError.set(
          toApiError(err)?.message ??
            $localize`:@@documents.batch.error.invalidData:Los datos del lote no son válidos. Revise el formulario.`,
        );
        break;
      case HttpStatusCode.Forbidden:
        this.submitError.set(
          $localize`:@@documents.upload.error.forbidden:No tiene permisos para cargar documentos.`,
        );
        break;
      case HttpStatusCode.NotFound:
        this.submitError.set(
          $localize`:@@documents.batch.error.categoryNotFound:La categoría seleccionada no existe o está inactiva.`,
        );
        this.loadCategories();
        break;
      case HttpStatusCode.PayloadTooLarge:
        this.submitError.set(
          $localize`:@@documents.batch.error.tooLarge:El tamaño total del lote excede el límite del servidor.`,
        );
        break;
      default:
        this.submitError.set(
          $localize`:@@documents.batch.error.generic:No fue posible cargar los documentos. Intente nuevamente en unos momentos.`,
        );
    }
  }
}
