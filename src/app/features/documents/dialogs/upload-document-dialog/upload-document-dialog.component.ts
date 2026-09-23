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
import { applyFieldErrors } from '@shared/forms/apply-field-errors';
import { toApiError } from '@shared/http/api-error';
import { injectActiveCategories } from '../active-categories';
import { syncSensitivityWithCategory } from '../sensitivity-sync';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { DocumentFormatIconComponent } from '@shared/components/document-format-icon/document-format-icon.component';
import { DocumentsService } from '@core/services/documents.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import {
  ALLOWED_EXTENSIONS,
  MAX_AREA_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_SIZE_BYTES,
  MAX_TITLE_LENGTH,
  RESPONSIBLE_AREAS,
  UploadDocumentResponse,
} from '@core/models/upload-document.model';
import { SensitivityLevel } from '@core/models/sensitivity-level.model';
import { SensitivityLockBannerComponent } from '@shared/sensitivity/sensitivity-lock-banner.component';
import { SensitivityInheritedBannerComponent } from '@shared/sensitivity/sensitivity-inherited-banner.component';
import { SensitivityRadioComponent } from '@shared/sensitivity/sensitivity-radio.component';
import { SensitivityMobileFieldComponent } from '@shared/sensitivity/sensitivity-mobile-field.component';
import { formatFileSize } from '@shared/utils/file-size';
import { formatYmd } from '@shared/utils/format-ymd';
import { isEditor } from '@core/auth/permissions';
import { inferFormat } from '@shared/utils/document-format';
import { FieldErrorComponent } from '@shared/forms/field-error.component';
import { DOCUMENT_FORM_LABELS, DOCUMENT_FORM_MESSAGES } from '../document-form.messages';

export type UploadDocumentDialogData = Record<string, never>;

export type UploadDocumentDialogResult =
  | { kind: 'uploaded'; document: UploadDocumentResponse }
  | undefined;

@Component({
  selector: 'app-upload-document-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FieldErrorComponent,
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
  templateUrl: './upload-document-dialog.component.html',
  styleUrl: './upload-document-dialog.component.scss',
})
export class UploadDocumentDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<UploadDocumentDialogComponent, UploadDocumentDialogResult>>(MatDialogRef);

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentsService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly dragOver = signal(false);
  private readonly activeCategories = injectActiveCategories();
  protected readonly categories = this.activeCategories.categories;
  protected readonly loadingCategories = this.activeCategories.loading;
  protected readonly loadCategoriesError = this.activeCategories.loadError;
  protected readonly titleAutoFilled = signal(false);

  protected readonly areas = RESPONSIBLE_AREAS;

  protected readonly messages = DOCUMENT_FORM_MESSAGES;
  protected readonly labels = DOCUMENT_FORM_LABELS;
  protected readonly maxTitleLength = MAX_TITLE_LENGTH;
  protected readonly maxDescriptionLength = MAX_DESCRIPTION_LENGTH;

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(MAX_TITLE_LENGTH)]],
    categoryId: [null as number | null, [Validators.required]],
    responsibleArea: ['', [Validators.required, Validators.maxLength(MAX_AREA_LENGTH)]],
    documentDate: [null as Date | null, [Validators.required]],
    description: ['', [Validators.maxLength(MAX_DESCRIPTION_LENGTH)]],
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
  protected readonly editorRole = computed(() => isEditor(this.auth.currentUser()?.role));
  protected readonly minSensitivity = computed(() => this.categoryDefault());

  constructor() {
    syncSensitivityWithCategory(this.form.controls.sensitivityLevel, this.categoryDefault);
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  protected loadCategories(): void {
    this.activeCategories.load();
  }

  protected onFileSelected(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      this.fileError.set(
        $localize`:@@documents.upload.error.format:Formato no permitido. Use PDF, DOCX, XLSX, JPG o PNG.`,
      );
      this.selectedFile.set(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.fileError.set(
        $localize`:@@documents.upload.error.size:El archivo supera los 10 MB permitidos.`,
      );
      this.selectedFile.set(null);
      return;
    }
    this.fileError.set(null);
    this.selectedFile.set(file);

    const titleCtrl = this.form.controls.title;
    if (!titleCtrl.value.trim() && !titleCtrl.dirty) {
      const autoName = file.name.replace(/\.[^.]+$/, '').slice(0, MAX_TITLE_LENGTH);
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

  protected onSubmit(): void {
    if (this.form.invalid || !this.selectedFile()) {
      this.form.markAllAsTouched();
      if (!this.selectedFile()) {
        this.fileError.set(
          $localize`:@@documents.upload.error.noFile:Seleccione un archivo para continuar.`,
        );
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
    fd.append('title', raw.title.trim());
    fd.append('categoryId', String(raw.categoryId));
    fd.append('responsibleArea', raw.responsibleArea);
    fd.append('documentDate', formatYmd(raw.documentDate!));
    fd.append('sensitivityLevel', raw.sensitivityLevel);
    const desc = raw.description.trim();
    if (desc) fd.append('description', desc);

    this.documentsService
      .create(fd)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => this.handleSuccess(res),
        error: (err: HttpErrorResponse) => this.handleError(err),
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected readonly inferFormat = inferFormat;

  protected formatSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  private handleSuccess(res: UploadDocumentResponse): void {
    this.notifications.success(
      $localize`:@@documents.upload.toast.title:Documento cargado`,
      $localize`:@@documents.upload.toast.description:"${res.title}:title:" se subió correctamente.`,
    );
    this.dialogRef.close({ kind: 'uploaded', document: res });
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
    switch (err.status) {
      case HttpStatusCode.BadRequest:
        // El archivo no es un control del formulario: su error va a la zona de carga.
        if (!applyFieldErrors(this.form, err, { file: (msg) => this.fileError.set(msg) })) {
          this.submitError.set(
            toApiError(err)?.message ??
              $localize`:@@common.error.invalidData:Los datos enviados no son válidos. Revise el formulario.`,
          );
        }
        break;
      case HttpStatusCode.Forbidden:
        this.submitError.set(
          $localize`:@@documents.upload.error.forbidden:No tiene permisos para cargar documentos.`,
        );
        break;
      case HttpStatusCode.NotFound:
        this.submitError.set(
          $localize`:@@documents.upload.error.categoryNotFound:La categoría seleccionada ya no existe o está inactiva. Cierre el formulario y vuelva a intentarlo.`,
        );
        break;
      case HttpStatusCode.PayloadTooLarge:
        this.fileError.set(
          $localize`:@@documents.upload.error.size:El archivo supera los 10 MB permitidos.`,
        );
        break;
      case HttpStatusCode.UnsupportedMediaType:
        this.fileError.set(
          $localize`:@@documents.upload.error.unsupportedMedia:Formato no permitido. Solo se aceptan PDF, DOCX, XLSX, JPG y PNG.`,
        );
        break;
      default:
        this.submitError.set(
          $localize`:@@documents.upload.error.generic:No fue posible cargar el documento. Intente nuevamente en unos momentos.`,
        );
    }
  }
}
