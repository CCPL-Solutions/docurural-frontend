import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  SensitivityLevel,
  SENSITIVITY_ICONS,
  SENSITIVITY_LABELS,
  SENSITIVITY_SHORT_LABELS,
} from '../../core/models/sensitivity-level.model';

@Component({
  selector: 'app-sensitivity-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <span
      class="sensitivity-badge"
      [class]="'sensitivity-badge--' + level() + ' sensitivity-badge--' + size()"
    >
      {{ label() }}
    </span>
  `,
  styleUrl: './sensitivity-badge.component.scss',
})
export class SensitivityBadgeComponent {
  readonly level    = input.required<SensitivityLevel>();
  readonly size     = input<'sm' | 'md'>('md');
  readonly withIcon = input(true);

  protected readonly label = computed(() =>
    this.size() === 'sm'
      ? SENSITIVITY_SHORT_LABELS[this.level()]
      : SENSITIVITY_LABELS[this.level()],
  );
  protected readonly icon = computed(() => SENSITIVITY_ICONS[this.level()]);
}
