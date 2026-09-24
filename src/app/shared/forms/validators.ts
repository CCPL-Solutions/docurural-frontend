import { ValidatorFn } from '@angular/forms';

/**
 * Longitud mínima sobre el valor sin espacios al principio ni al final (FRM-04, D24): "  ab  " no
 * cumple un mínimo de 3. Devuelve el mismo error que `Validators.minLength` (`minlength`), así
 * que los mensajes de error no cambian.
 */
export function trimmedMinLength(min: number): ValidatorFn {
  return (control) => {
    const value = ((control.value as string | null) ?? '').trim();
    return value.length >= min
      ? null
      : { minlength: { requiredLength: min, actualLength: value.length } };
  };
}
