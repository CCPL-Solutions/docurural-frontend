import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Role, ROLE_LABELS } from '../../../../core/models/role.model';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge.component';

const ROLE_VARIANT: Record<Role, BadgeVariant> = {
  ADMIN: 'primary',
  EDITOR: 'success',
  READER: 'neutral',
};

@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-badge [variant]="variant()" [dot]="true">{{ label() }}</app-badge> `,
})
export class RoleBadgeComponent {
  readonly role = input.required<Role>();

  protected readonly label = computed(() => ROLE_LABELS[this.role()]);
  protected readonly variant = computed(() => ROLE_VARIANT[this.role()]);
}
