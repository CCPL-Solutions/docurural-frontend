import {
  MAX_EMAIL_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_FULL_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@core/models/user-form.model';
import { FieldErrorMessages } from '@shared/forms/field-error';

const PASSWORD_RULES = {
  minLength: `Debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
  maxLength: `No puede superar los ${MAX_PASSWORD_LENGTH} caracteres`,
  noLowercase: 'Debe incluir al menos una letra minúscula',
  noUppercase: 'Debe incluir al menos una letra mayúscula',
  noDigit: 'Debe incluir al menos un número',
  noSymbol: 'Debe incluir al menos un símbolo (ej: !, @, #, $)',
};

/** Mensajes de error de los campos del formulario de usuario (FRM-03). */
export const USER_FORM_MESSAGES = {
  fullName: {
    required: 'Ingrese el nombre completo',
    minlength: `El nombre debe tener al menos ${MIN_FULL_NAME_LENGTH} caracteres`,
    maxlength: `El nombre no puede superar los ${MAX_FULL_NAME_LENGTH} caracteres`,
  },
  email: {
    required: 'Ingrese el correo electrónico',
    email: 'Ingrese un correo electrónico válido',
    maxlength: `El correo no puede superar los ${MAX_EMAIL_LENGTH} caracteres`,
  },
  role: {
    required: 'Seleccione un rol',
  },
  password: {
    required: 'Ingrese una contraseña',
    ...PASSWORD_RULES,
  },
  confirmPassword: {
    required: 'Confirme su contraseña',
    ...PASSWORD_RULES,
    passwordMismatch: 'Las contraseñas no coinciden',
  },
} satisfies Record<string, FieldErrorMessages>;
