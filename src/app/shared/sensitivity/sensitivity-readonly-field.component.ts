import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  SensitivityLevel,
  SENSITIVITY_ACCESS_HINTS,
  SENSITIVITY_ICONS,
  SENSITIVITY_LABELS,
} from '../../core/models/sensitivity-level.model';

@Component({
  selector: 'app-sensitivity-readonly-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="sensitivity-ro">
      <div class="sensitivity-ro__icon-chip" [class]="'sensitivity-ro__icon-chip--' + level()">
        <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      </div>
      <div class="sensitivity-ro__body">
        <div class="sensitivity-ro__label">{{ label() }}</div>
        <div class="sensitivity-ro__hint">
          @if (inherited() && categoryName()) {
            Heredado de la categoría <strong>{{ categoryName() }}</strong>
          } @else {
            {{ accessHint() }}
          }
        </div>
      </div>
      @if (inherited()) {
        <span class="sensitivity-ro__badge">
          <mat-icon aria-hidden="true">lock</mat-icon>
          Heredado
        </span>
      }
    </div>
  `,
  styleUrl: './sensitivity-readonly-field.component.scss',
})
export class SensitivityReadonlyFieldComponent {
  readonly level = input.required<SensitivityLevel>();
  readonly inherited = input(false);
  readonly categoryName = input<string | null>(null);

  protected readonly label = computed(() => SENSITIVITY_LABELS[this.level()]);
  protected readonly icon = computed(() => SENSITIVITY_ICONS[this.level()]);
  protected readonly accessHint = computed(() => SENSITIVITY_ACCESS_HINTS[this.level()]);
}
