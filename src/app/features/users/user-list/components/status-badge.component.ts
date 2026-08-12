import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STATUS_LABELS, UserStatus } from '../../../../core/models/user-status.model';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge.component';

const STATUS_VARIANT: Record<UserStatus, BadgeVariant> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-badge [variant]="variant()" [dot]="true">{{ label() }}</app-badge> `,
})
export class StatusBadgeComponent {
  readonly status = input.required<UserStatus>();

  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
  protected readonly variant = computed(() => STATUS_VARIANT[this.status()]);
}
