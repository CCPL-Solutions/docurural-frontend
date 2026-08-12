import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type KpiAccent = 'primary' | 'success' | 'warning';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [MatIconModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input('');
  readonly accent = input<KpiAccent>('primary');

  protected readonly accentClass = computed(() => `kpi-card--${this.accent()}`);
}
