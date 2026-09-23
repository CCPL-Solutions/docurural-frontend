import { AbstractControl } from '@angular/forms';

/**
 * Mensajes de error de un campo: clave del error de validación → texto. El orden de las claves
 * es la prioridad (se muestra el primero que aplique). Cada feature los declara en su
 * `*.messages.ts` (FRM-03), así los textos quedan listos para la i18n (Fase 8).
 */
export type FieldErrorMessages = Readonly<Record<string, string>>;

/**
 * Mensaje de error a mostrar para un control, o `null` si no hay que mostrar ninguno:
 *
 * - Solo si el control está tocado.
 * - Primero los errores del control, en el orden de `messages`; después, el error `backend`
 *   (su valor es el texto del servidor, lo pone `applyFieldErrors`).
 * - Por último, los `groupErrors` del grupo padre (p. ej. `passwordMismatch`), aunque el control
 *   en sí sea válido.
 */
export function fieldErrorMessage(
  control: AbstractControl,
  messages: FieldErrorMessages,
  groupErrors: readonly string[] = [],
): string | null {
  if (!control.touched) return null;
  if (control.invalid) {
    for (const key of Object.keys(messages)) {
      if (control.hasError(key)) return messages[key];
    }
    const backend: unknown = control.getError('backend');
    if (typeof backend === 'string') return backend;
  }
  for (const key of groupErrors) {
    if (control.parent?.hasError(key)) return messages[key] ?? null;
  }
  return null;
}
