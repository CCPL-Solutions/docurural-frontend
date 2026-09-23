import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, merge } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { FieldErrorMessages, fieldErrorMessage } from './field-error';

/**
 * Mensaje de error de un campo de formulario (FRM-03). Sustituye a los métodos `xxxError()` de
 * cada componente: `<app-field-error [control]="form.controls.email" [messages]="MESSAGES.email" />`.
 *
 * El contenido proyectado (p. ej. un `<small class="field__hint">`) se muestra cuando no hay error.
 */
@Component({
  selector: 'app-field-error',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message(); as msg) {
      <p class="field__error" [attr.id]="errorId() || null">
        <mat-icon aria-hidden="true">error</mat-icon>
        {{ msg }}
      </p>
    } @else {
      <ng-content />
    }
  `,
  host: { style: 'display: contents' },
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  readonly messages = input.required<FieldErrorMessages>();
  /** Errores del grupo padre que se muestran en este campo (p. ej. `passwordMismatch`). */
  readonly groupErrors = input<readonly string[]>([]);
  /** `id` del mensaje, para el `aria-describedby` del campo. */
  readonly errorId = input('');

  // Los controles de formulario no son signals: se recalcula con cada evento del control (valor,
  // estado, tocado) o de su grupo, para que funcione con OnPush y sin zone.js.
  private readonly changes = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        merge(control.events, control.parent?.events ?? EMPTY).pipe(startWith(null)),
      ),
    ),
  );

  protected readonly message = computed(() => {
    this.changes();
    return fieldErrorMessage(this.control(), this.messages(), this.groupErrors());
  });
}
