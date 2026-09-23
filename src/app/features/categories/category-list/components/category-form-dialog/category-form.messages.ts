import {
  MAX_CATEGORY_DESCRIPTION_LENGTH,
  MAX_CATEGORY_NAME_LENGTH,
  MIN_CATEGORY_NAME_LENGTH,
} from '@core/models/category.model';
import { FieldErrorMessages } from '@shared/forms/field-error';

const NAME_LENGTH = `El nombre debe tener entre ${MIN_CATEGORY_NAME_LENGTH} y ${MAX_CATEGORY_NAME_LENGTH} caracteres.`;

/** Mensajes de error de los campos del formulario de categoría (FRM-03). */
export const CATEGORY_FORM_MESSAGES = {
  name: {
    required: 'Ingrese el nombre de la categoría.',
    minlength: NAME_LENGTH,
    maxlength: NAME_LENGTH,
  },
  description: {
    maxlength: `La descripción no puede superar los ${MAX_CATEGORY_DESCRIPTION_LENGTH} caracteres.`,
  },
  defaultSensitivityLevel: {
    required: 'Seleccione el nivel de sensibilidad por defecto.',
  },
} satisfies Record<string, FieldErrorMessages>;
