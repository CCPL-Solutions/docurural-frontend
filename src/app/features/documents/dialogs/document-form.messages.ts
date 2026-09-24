import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '@core/models/upload-document.model';
import { FieldErrorMessages } from '@shared/forms/field-error';

/**
 * Mensajes de error de los campos de metadatos de documento (FRM-03). Los comparten los diálogos
 * de subida, subida en lote y edición.
 */
export const DOCUMENT_FORM_MESSAGES = {
  title: {
    required: $localize`:@@documents.form.title.required:El título es obligatorio.`,
    maxlength: $localize`:@@documents.form.title.maxLength:El título no puede superar los ${MAX_TITLE_LENGTH}:max: caracteres.`,
  },
  categoryId: {
    required: $localize`:@@documents.form.category.required:Seleccione una categoría.`,
  },
  responsibleArea: {
    required: $localize`:@@documents.form.area.required:El área responsable es obligatoria.`,
  },
  documentDate: {
    required: $localize`:@@documents.form.date.required:La fecha del documento es obligatoria.`,
  },
  description: {
    maxlength: $localize`:@@documents.form.description.maxLength:La descripción no puede superar los ${MAX_DESCRIPTION_LENGTH}:max: caracteres.`,
  },
  sensitivityLevel: {
    required: $localize`:@@documents.form.sensitivity.required:Debe seleccionar el nivel de sensibilidad del documento.`,
  },
} satisfies Record<string, FieldErrorMessages>;

/** Textos de los selectores de los diálogos de documentos que dependen del estado. */
export const DOCUMENT_FORM_LABELS = {
  loadingCategories: $localize`:@@documents.form.category.loading:Cargando categorías…`,
  selectCategory: $localize`:@@documents.form.category.placeholder:Seleccione una categoría`,
};
