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
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { DocumentFormatIconComponent } from '@shared/components/document-format-icon/document-format-icon.component';
import { DocumentsService } from '@core/services/documents.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { DocumentDetailResponse } from '@core/models/document-detail.model';
import {
  MAX_AREA_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  RESPONSIBLE_AREAS,
} from '@core/models/upload-document.model';
import {
  UpdateDocumentMetadataRequest,
  UpdateDocumentMetadataResponse,
} from '@core/models/update-document.model';
import { SensitivityLevel, isAtLeast } from '@core/models/sensitivity-level.model';
import { SensitivityLockBannerComponent } from '@shared/sensitivity/sensitivity-lock-banner.component';
import { SensitivityInheritedBannerComponent } from '@shared/sensitivity/sensitivity-inherited-banner.component';
import { SensitivityRadioComponent } from '@shared/sensitivity/sensitivity-radio.component';
import { SensitivityMobileFieldComponent } from '@shared/sensitivity/sensitivity-mobile-field.component';
import { formatFileSize } from '@shared/utils/file-size';
import { formatYmd } from '@shared/utils/format-ymd';
import { DatePipe } from '@angular/common';
import { isEditor } from '@core/auth/permissions';
import { DATE_TIME_FORMAT } from '@shared/utils/date-formats';
import { parseYmd } from '@shared/utils/parse-date';
import { FieldErrorComponent } from '@shared/forms/field-error.component';
import { DOCUMENT_FORM_LABELS, DOCUMENT_FORM_MESSAGES } from '../document-form.messages';

export interface EditDocumentMetadataDialogData {
  document: DocumentDetailResponse;
}

export type EditDocumentMetadataDialogResult =
  | { kind: 'updated'; document: UpdateDocumentMetadataResponse }
  | undefined;

@Component({
  selector: 'app-edit-document-metadata-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FieldErrorComponent,
    DatePipe,
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentsService = inject(DocumentsService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  private readonly activeCategories = injectActiveCategories();
  protected readonly categories = this.activeCategories.categories;
  protected readonly loadingCategories = this.activeCategories.loading;
  protected readonly loadCategoriesError = this.activeCategories.loadError;

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

  private readonly docOriginalSensitivity = signal<SensitivityLevel>('INTERNAL');

  protected readonly selectedCategory = computed(() =>
    this.categories().find((c) => c.id === this.categoryIdValue()),
  );
  protected readonly categoryDefault = computed(
    () => this.selectedCategory()?.defaultSensitivityLevel ?? 'INTERNAL',
  );
  protected readonly sensitivityLocked = computed(() => this.categoryDefault() !== 'INTERNAL');
  protected readonly editorRole = computed(() => isEditor(this.auth.currentUser()?.role));
  protected readonly minSensitivity = computed(() => {
    const catMin = this.categoryDefault();
    const docMin = this.docOriginalSensitivity();
    if (this.editorRole()) {
      return isAtLeast(catMin, docMin) ? catMin : docMin;
    }
    return catMin;
  });

  constructor() {
    syncSensitivityWithCategory(
      this.form.controls.sensitivityLevel,
      this.categoryDefault,
      this.minSensitivity,
    );
  }

  protected readonly formatFileSize = formatFileSize;

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;

  ngOnInit(): void {
    this.loadCategories();
    const doc = this.data.document;
    this.docOriginalSensitivity.set(doc.sensitivityLevel);
    this.form.patchValue({
      title: doc.title,
      categoryId: doc.category.id,
      responsibleArea: doc.responsibleArea,
      documentDate: parseYmd(doc.documentDate),
      description: doc.description ?? '',
      sensitivityLevel: doc.sensitivityLevel,
    });
  }

  protected loadCategories(): void {
    this.activeCategories.load();
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
    const desc = raw.description.trim();
    const payload: UpdateDocumentMetadataRequest = {
      title: raw.title.trim(),
      categoryId: raw.categoryId!,
      responsibleArea: raw.responsibleArea,
      documentDate: formatYmd(raw.documentDate!),
      sensitivityLevel: raw.sensitivityLevel,
      ...(desc ? { description: desc } : {}),
    };

    this.documentsService
      .update(this.data.document.id, payload)
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

  private handleSuccess(res: UpdateDocumentMetadataResponse): void {
    this.notifications.success(
      $localize`:@@documents.edit.toast.title:Metadatos actualizados`,
      res.message ??
        $localize`:@@users.toast.updated.description:Los cambios se guardaron correctamente.`,
    );
    this.dialogRef.close({ kind: 'updated', document: res });
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
        if (!applyFieldErrors(this.form, err)) {
          this.submitError.set(
            toApiError(err)?.message ??
              $localize`:@@common.error.invalidData:Los datos enviados no son válidos. Revise el formulario.`,
          );
        }
        break;
      case HttpStatusCode.Forbidden:
        this.submitError.set(
          $localize`:@@documents.edit.error.forbidden:No tiene permisos para editar este documento.`,
        );
        break;
      case HttpStatusCode.NotFound:
        this.submitError.set(
          $localize`:@@documents.edit.error.notFound:El documento ya no existe o fue eliminado. Cierre el formulario y recargue el listado.`,
        );
        break;
      default:
        this.submitError.set(
          $localize`:@@common.error.saveChanges:No fue posible guardar los cambios. Intente de nuevo.`,
        );
    }
  }
}
