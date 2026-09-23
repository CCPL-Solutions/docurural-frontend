import { AbstractControl } from '@angular/forms';
import { fieldErrorsOf } from '@shared/http/api-error';

/**
 * Aplica los errores de campo del backend (400 con `fieldErrors`) al formulario: cada control
 * recibe `{ backend: mensaje }` y se marca como tocado para que el mensaje se vea sin salir del
 * campo (API-03, corrige R9).
 *
 * Los campos que no son controles del formulario (p. ej. el archivo de una subida) se pueden
 * atender con `otherFields`: campo → función que recibe el mensaje.
 *
 * Devuelve `true` si había errores de campo, para que el llamador decida si mostrar además un
 * error general.
 */
export function applyFieldErrors(
  form: AbstractControl,
  err: unknown,
  otherFields: Readonly<Record<string, (message: string) => void>> = {},
): boolean {
  const fieldErrors = fieldErrorsOf(err);
  if (!fieldErrors) return false;
  for (const [field, message] of Object.entries(fieldErrors)) {
    if (Object.hasOwn(otherFields, field)) {
      otherFields[field](message);
      continue;
    }
    const control = form.get(field);
    if (!control) continue;
    control.setErrors({ backend: message });
    control.markAsTouched();
  }
  return true;
}
