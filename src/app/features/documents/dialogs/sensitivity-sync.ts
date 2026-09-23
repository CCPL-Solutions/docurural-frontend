import { Signal, effect } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SensitivityLevel, clampToMin, isAtLeast } from '@core/models/sensitivity-level.model';

/**
 * Mantiene el nivel de sensibilidad de un documento coherente con la categoría elegida (D20,
 * tarea 5.11). Lo usan los diálogos de subida, subida en lote y edición. Debe llamarse en un
 * contexto de inyección (constructor o inicializador de campo).
 *
 * - Si la categoría exige un nivel superior a INTERNAL, el campo se fija a ese nivel y se bloquea.
 * - Al salir de una categoría bloqueada, el campo se desbloquea con el nivel de la nueva categoría.
 * - Si no, se sube al mínimo (`minSensitivity`) cuando el valor actual queda por debajo.
 */
export function syncSensitivityWithCategory(
  control: FormControl<SensitivityLevel>,
  categoryDefault: Signal<SensitivityLevel>,
  minSensitivity: Signal<SensitivityLevel> = categoryDefault,
): void {
  effect(() => {
    const catDefault = categoryDefault();
    const min = minSensitivity();
    if (catDefault !== 'INTERNAL') {
      control.setValue(catDefault, { emitEvent: false });
      control.disable({ emitEvent: false });
    } else {
      const wasLocked = control.disabled;
      control.enable({ emitEvent: false });
      if (wasLocked) {
        control.setValue(catDefault, { emitEvent: false });
      } else if (!isAtLeast(control.value, min)) {
        control.setValue(clampToMin(control.value, min), { emitEvent: false });
      }
    }
    control.markAsPristine();
  });
}
