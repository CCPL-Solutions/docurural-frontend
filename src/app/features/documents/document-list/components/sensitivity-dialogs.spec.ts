// Tests de caracterización (Fase 1, tarea 1.6): fijan el comportamiento ACTUAL de la regla de
// sensibilidad en los tres diálogos de documentos para que su deduplicación (Fase 5, tarea 5.11)
// no lo altere. Se prueban sin plantilla: el componente se instancia en un contexto de inyección y
// los effects se ejecutan con TestBed.tick().
import { signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Category } from '@core/models/category.model';
import { DocumentDetailResponse } from '@core/models/document-detail.model';
import { Role } from '@core/models/role.model';
import { SensitivityLevel } from '@core/models/sensitivity-level.model';
import { AuthenticatedUser } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { CategoriesService } from '@core/services/categories.service';
import { DocumentsService } from '@core/services/documents.service';
import { NotificationService } from '@core/services/notification.service';
import { EditDocumentMetadataDialogComponent } from '../../dialogs/edit-document-metadata-dialog/edit-document-metadata-dialog.component';
import { UploadDocumentDialogComponent } from '../../dialogs/upload-document-dialog/upload-document-dialog.component';
import { UploadDocumentsBatchDialogComponent } from './upload-documents-batch-dialog/upload-documents-batch-dialog.component';

const category = (
  id: number,
  defaultSensitivityLevel: SensitivityLevel,
  status: Category['status'] = 'ACTIVE',
): Category => ({
  id,
  name: `Categoría ${id}`,
  description: null,
  status,
  documentCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'Ana Pérez',
  defaultSensitivityLevel,
});

const INTERNAL_CAT = 1;
const RESTRICTED_CAT = 2;
const CONFIDENTIAL_CAT = 3;
const CATEGORIES = [
  category(INTERNAL_CAT, 'INTERNAL'),
  category(RESTRICTED_CAT, 'RESTRICTED'),
  category(CONFIDENTIAL_CAT, 'CONFIDENTIAL'),
  category(4, 'RESTRICTED', 'INACTIVE'),
];

/** Acceso a los miembros protegidos que usa la plantilla. */
interface SensitivityDialog {
  ngOnInit(): void;
  categories(): Category[];
  sensitivityLocked(): boolean;
  form: {
    controls: { categoryId: FormControl<number | null>; sensitivityLevel: FormControl };
  };
}

function createDialog<T>(component: Type<T>, role: Role, data: unknown = {}): SensitivityDialog {
  const user: AuthenticatedUser = { id: 1, fullName: 'Ana Pérez', email: 'a@b.co', role };
  TestBed.configureTestingModule({
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close: vi.fn(), disableClose: false } },
      { provide: CategoriesService, useValue: { list: () => of({ categories: CATEGORIES }) } },
      { provide: DocumentsService, useValue: {} },
      { provide: NotificationService, useValue: {} },
      { provide: AuthService, useValue: { currentUser: signal(user) } },
    ],
  });
  const dialog = TestBed.runInInjectionContext(
    () => new component(),
  ) as unknown as SensitivityDialog;
  dialog.ngOnInit();
  TestBed.tick();
  return dialog;
}

function selectCategory(dialog: SensitivityDialog, id: number): void {
  dialog.form.controls.categoryId.setValue(id);
  TestBed.tick();
}

const sensitivity = (dialog: SensitivityDialog) => ({
  value: dialog.form.controls.sensitivityLevel.value as SensitivityLevel,
  disabled: dialog.form.controls.sensitivityLevel.disabled,
});

describe.each([
  ['UploadDocumentDialogComponent', UploadDocumentDialogComponent],
  ['UploadDocumentsBatchDialogComponent', UploadDocumentsBatchDialogComponent],
] as const)('%s — sensibilidad', (_name, component) => {
  it('solo ofrece categorías activas', () => {
    const dialog = createDialog(component as Type<unknown>, 'ADMIN');
    expect(dialog.categories().map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('empieza en INTERNAL y editable', () => {
    const dialog = createDialog(component as Type<unknown>, 'ADMIN');
    expect(sensitivity(dialog)).toEqual({ value: 'INTERNAL', disabled: false });
  });

  it('una categoría sensible bloquea el nivel en su valor por defecto', () => {
    const dialog = createDialog(component as Type<unknown>, 'ADMIN');
    selectCategory(dialog, RESTRICTED_CAT);
    expect(sensitivity(dialog)).toEqual({ value: 'RESTRICTED', disabled: true });
    expect(dialog.sensitivityLocked()).toBe(true);

    selectCategory(dialog, CONFIDENTIAL_CAT);
    expect(sensitivity(dialog)).toEqual({ value: 'CONFIDENTIAL', disabled: true });
  });

  it('al volver a una categoría INTERNAL se desbloquea y vuelve a INTERNAL', () => {
    const dialog = createDialog(component as Type<unknown>, 'ADMIN');
    selectCategory(dialog, CONFIDENTIAL_CAT);
    selectCategory(dialog, INTERNAL_CAT);
    expect(sensitivity(dialog)).toEqual({ value: 'INTERNAL', disabled: false });
  });
});

describe('EditDocumentMetadataDialogComponent — sensibilidad', () => {
  const doc = (
    sensitivityLevel: SensitivityLevel,
    categoryId = INTERNAL_CAT,
  ): { document: DocumentDetailResponse } => ({
    document: {
      id: 10,
      title: 'Acta',
      description: null,
      category: { id: categoryId, name: `Categoría ${categoryId}` },
      responsibleArea: 'Rectoría',
      documentDate: '2026-03-01',
      fileFormat: 'PDF',
      fileSizeBytes: 1000,
      originalFileName: 'acta.pdf',
      uploadedBy: { id: 1, fullName: 'Ana Pérez' },
      createdAt: '2026-03-01T10:00:00Z',
      sensitivityLevel,
    },
  });

  it('carga el nivel del documento', () => {
    const dialog = createDialog(EditDocumentMetadataDialogComponent, 'ADMIN', doc('RESTRICTED'));
    expect(sensitivity(dialog)).toEqual({ value: 'RESTRICTED', disabled: false });
  });

  it('un documento en categoría sensible queda bloqueado en el nivel de la categoría', () => {
    const dialog = createDialog(
      EditDocumentMetadataDialogComponent,
      'ADMIN',
      doc('CONFIDENTIAL', RESTRICTED_CAT),
    );
    expect(sensitivity(dialog)).toEqual({ value: 'RESTRICTED', disabled: true });
  });

  it('EDITOR: el mínimo es el nivel original del documento', () => {
    const dialog = createDialog(EditDocumentMetadataDialogComponent, 'EDITOR', doc('CONFIDENTIAL'));
    expect(sensitivity(dialog)).toEqual({ value: 'CONFIDENTIAL', disabled: false });
  });

  it('ADMIN: al volver de una categoría sensible a una INTERNAL queda en INTERNAL', () => {
    const dialog = createDialog(EditDocumentMetadataDialogComponent, 'ADMIN', doc('CONFIDENTIAL'));
    selectCategory(dialog, RESTRICTED_CAT);
    selectCategory(dialog, INTERNAL_CAT);
    expect(sensitivity(dialog)).toEqual({ value: 'INTERNAL', disabled: false });
  });

  // Comportamiento actual, pendiente de confirmar (Q6 en docs/plan-remediacion.md): al salir de una
  // categoría bloqueada, la rama `wasLocked` asigna el valor por defecto de la categoría sin aplicar
  // el mínimo del EDITOR, así que un documento CONFIDENTIAL puede acabar en INTERNAL.
  it('EDITOR: al volver de una categoría sensible a una INTERNAL queda en INTERNAL (actual)', () => {
    const dialog = createDialog(EditDocumentMetadataDialogComponent, 'EDITOR', doc('CONFIDENTIAL'));
    selectCategory(dialog, RESTRICTED_CAT);
    selectCategory(dialog, INTERNAL_CAT);
    expect(sensitivity(dialog)).toEqual({ value: 'INTERNAL', disabled: false });
  });
});
