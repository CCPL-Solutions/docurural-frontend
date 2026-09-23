import { FieldErrorMessages } from '@shared/forms/field-error';

/** Mensajes de error de los campos del login (FRM-03). */
export const LOGIN_MESSAGES = {
  email: {
    required: 'Ingrese su correo electrónico',
    email: 'Ingrese un correo electrónico válido',
  },
  password: {
    required: 'Ingrese su contraseña',
  },
} satisfies Record<string, FieldErrorMessages>;
