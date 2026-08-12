import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { User } from '../../../../core/models/user.model';
import { avatarColor, avatarInitials } from '../utils/avatar-color';

@Component({
  selector: 'app-user-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="identity">
      <div
        class="identity__avatar"
        [class.identity__avatar--lg]="size() === 'lg'"
        [style]="avatarStyle()"
        aria-hidden="true"
      >
        {{ initials() }}
      </div>
      <div class="identity__text">
        <div class="identity__name" [class.identity__name--muted]="muted()">
          {{ user().fullName }}
        </div>
        <div class="identity__email" [class.identity__email--muted]="muted()">
          {{ user().email }}
        </div>
      </div>
    </div>
  `,
  styleUrl: './user-identity.component.scss',
})
export class UserIdentityComponent {
  readonly user = input.required<User>();
  readonly muted = input(false);
  readonly size = input<'sm' | 'lg'>('sm');

  protected readonly initials = computed(() => avatarInitials(this.user().fullName));
  protected readonly avatarStyle = computed(() => {
    const c = avatarColor(this.user().fullName, this.muted());
    return { 'background-color': c.bg, color: c.fg };
  });
}
