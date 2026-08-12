import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SensitivityLevel, SENSITIVITY_LABELS } from '../../core/models/sensitivity-level.model';

@Component({
  selector: 'app-sensitivity-inherited-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="inherited-banner">
      <mat-icon class="inherited-banner__icon" aria-hidden="true">info</mat-icon>
      <p class="inherited-banner__text">
        El nivel <strong>{{ label() }}</strong> se heredó de la categoría
        <strong>{{ categoryName() }}</strong
        >.
        @if (canRaise()) {
          {{ raiseHint() }}
        }
      </p>
    </div>
  `,
  styleUrl: './sensitivity-inherited-banner.component.scss',
})
export class SensitivityInheritedBannerComponent {
  readonly level = input.required<SensitivityLevel>();
  readonly categoryName = input.required<string>();
  readonly canRaise = input(false);
  readonly raiseHint = input('Si el documento contiene datos sensibles, puede subir el nivel.');

  protected readonly label = computed(() => SENSITIVITY_LABELS[this.level()]);
}
