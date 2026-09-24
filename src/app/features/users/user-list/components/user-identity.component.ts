import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { User } from '@core/models/user.model';
import { avatarColor } from '@shared/utils/name-color';
import { userInitials } from '@shared/utils/user-initials';

@Component({
  selector: 'app-user-identity',
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

  protected readonly initials = computed(() => userInitials(this.user().fullName));
  protected readonly avatarStyle = computed(() => {
    const c = avatarColor(this.user().fullName, this.muted());
    return { 'background-color': c.bg, color: c.fg };
  });
}
