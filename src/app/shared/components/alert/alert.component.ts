import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type AlertVariant = 'error' | 'warning' | 'success' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alert" [class]="'alert--' + variant()" role="alert">
      <mat-icon class="alert__icon" aria-hidden="true">{{ iconName() }}</mat-icon>
      <div class="alert__content">
        @if (title()) {
          <strong class="alert__title">{{ title() }}</strong>
        }
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './alert.component.scss',
})
export class AlertComponent {
  readonly variant = input<AlertVariant>('error');
  readonly title = input('');

  protected readonly iconName = computed(() => {
    switch (this.variant()) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'check_circle';
      case 'info':
        return 'info';
    }
  });
}
