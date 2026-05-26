import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  SensitivityLevel,
  SENSITIVITY_ICONS,
  SENSITIVITY_LABELS,
} from '../../core/models/sensitivity-level.model';

@Component({
  selector: 'app-sensitivity-lock-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="lock-banner" [class]="'lock-banner--' + level()">
      <div class="lock-banner__icon-chip">
        <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      </div>
      <div class="lock-banner__body">
        <p class="lock-banner__title">Esta categoría tiene datos sensibles</p>
        <p class="lock-banner__text">
          El nivel de sensibilidad se asigna automáticamente como
          <strong>{{ labelLower() }}</strong>
          @if (categoryName()) {
            porque la categoría <strong>{{ categoryName() }}</strong> está configurada así
          }.
          No puede modificarse desde este formulario.
        </p>
      </div>
    </div>
  `,
  styleUrl: './sensitivity-lock-banner.component.scss',
})
export class SensitivityLockBannerComponent {
  readonly level        = input.required<SensitivityLevel>();
  readonly categoryName = input<string | null>(null);

  protected readonly icon       = computed(() => SENSITIVITY_ICONS[this.level()]);
  protected readonly labelLower = computed(() => SENSITIVITY_LABELS[this.level()].toLowerCase());
}
