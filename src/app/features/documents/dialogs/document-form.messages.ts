import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '@core/models/upload-document.model';
import { FieldErrorMessages } from '@shared/forms/field-error';

/**
 * Mensajes de error de los campos de metadatos de documento (FRM-03). Los comparten los diálogos
 * de subida, subida en lote y edición.
 */
export const DOCUMENT_FORM_MESSAGES = {
  title: {
    required: 'El título es obligatorio.',
    maxlength: `El título no puede superar los ${MAX_TITLE_LENGTH} caracteres.`,
  },
  categoryId: {
    required: 'Seleccione una categoría.',
  },
  responsibleArea: {
    required: 'El área responsable es obligatoria.',
  },
  documentDate: {
    required: 'La fecha del documento es obligatoria.',
  },
  description: {
    maxlength: `La descripción no puede superar los ${MAX_DESCRIPTION_LENGTH} caracteres.`,
  },
  sensitivityLevel: {
    required: 'Debe seleccionar el nivel de sensibilidad del documento.',
  },
} satisfies Record<string, FieldErrorMessages>;
