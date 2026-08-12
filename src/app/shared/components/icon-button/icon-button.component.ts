import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

export type IconButtonVariant = 'default' | 'danger';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="icon-btn"
      [class.icon-btn--danger]="variant() === 'danger'"
      [type]="type()"
      [disabled]="disabled()"
      [matTooltip]="tooltip()"
      [attr.aria-label]="ariaLabel() || tooltip() || null"
    >
      <ng-content />
    </button>
  `,
  styleUrl: './icon-button.component.scss',
})
export class IconButtonComponent {
  readonly variant = input<IconButtonVariant>('default');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly tooltip = input('');
  readonly ariaLabel = input('');
}
