import {
  MAX_EMAIL_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_FULL_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@core/models/user-form.model';
import { FieldErrorMessages } from '@shared/forms/field-error';

const PASSWORD_RULES = {
  minLength: $localize`:@@users.form.password.minLength:Debe tener al menos ${MIN_PASSWORD_LENGTH}:min: caracteres.`,
  maxLength: $localize`:@@users.form.password.maxLength:No puede superar los ${MAX_PASSWORD_LENGTH}:max: caracteres.`,
  noLowercase: $localize`:@@users.form.password.noLowercase:Debe incluir al menos una letra minúscula.`,
  noUppercase: $localize`:@@users.form.password.noUppercase:Debe incluir al menos una letra mayúscula.`,
  noDigit: $localize`:@@users.form.password.noDigit:Debe incluir al menos un número.`,
  noSymbol: $localize`:@@users.form.password.noSymbol:Debe incluir al menos un símbolo (ej: !, @, #, $).`,
};

/** Mensajes de error de los campos del formulario de usuario (FRM-03). */
export const USER_FORM_MESSAGES = {
  fullName: {
    required: $localize`:@@users.form.fullName.required:Ingrese el nombre completo.`,
    minlength: $localize`:@@users.form.fullName.minLength:El nombre debe tener al menos ${MIN_FULL_NAME_LENGTH}:min: caracteres.`,
    maxlength: $localize`:@@users.form.fullName.maxLength:El nombre no puede superar los ${MAX_FULL_NAME_LENGTH}:max: caracteres.`,
  },
  email: {
    required: $localize`:@@users.form.email.required:Ingrese el correo electrónico.`,
    email: $localize`:@@login.email.invalid:Ingrese un correo electrónico válido.`,
    maxlength: $localize`:@@users.form.email.maxLength:El correo no puede superar los ${MAX_EMAIL_LENGTH}:max: caracteres.`,
  },
  role: {
    required: $localize`:@@users.form.role.required:Seleccione un rol.`,
  },
  password: {
    required: $localize`:@@users.form.password.required:Ingrese una contraseña.`,
    ...PASSWORD_RULES,
  },
  confirmPassword: {
    required: $localize`:@@users.form.confirmPassword.required:Confirme su contraseña.`,
    ...PASSWORD_RULES,
    passwordMismatch: $localize`:@@users.form.confirmPassword.mismatch:Las contraseñas no coinciden.`,
  },
} satisfies Record<string, FieldErrorMessages>;
