import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CategoryStatus } from '../../../../core/models/category-status.model';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge.component';

const STATUS_LABELS: Record<CategoryStatus, string> = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
};

const STATUS_VARIANT: Record<CategoryStatus, BadgeVariant> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

@Component({
  selector: 'app-category-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-badge [variant]="variant()" [dot]="true">{{ label() }}</app-badge> `,
})
export class CategoryStatusBadgeComponent {
  readonly status = input.required<CategoryStatus>();

  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
  protected readonly variant = computed(() => STATUS_VARIANT[this.status()]);
}
