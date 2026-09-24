import { FieldErrorMessages } from '@shared/forms/field-error';

/** Mensajes de error de los campos del login (FRM-03). */
export const LOGIN_MESSAGES = {
  email: {
    required: $localize`:@@login.email.required:Ingrese su correo electrónico.`,
    email: $localize`:@@login.email.invalid:Ingrese un correo electrónico válido.`,
  },
  password: {
    required: $localize`:@@login.password.required:Ingrese su contraseña.`,
  },
} satisfies Record<string, FieldErrorMessages>;
