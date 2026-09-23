import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

export type IconButtonVariant = 'default' | 'danger';

@Component({
  selector: 'app-icon-button',
  imports: [MatTooltipModule, NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Con `link` se renderiza un enlace (navegación pura, RUT-01); si no, un botón.
  template: `
    <ng-template #content><ng-content /></ng-template>
    @if (link(); as link) {
      <a
        class="icon-btn"
        [class.icon-btn--danger]="variant() === 'danger'"
        [routerLink]="link"
        [matTooltip]="tooltip()"
        [attr.aria-label]="ariaLabel() || tooltip() || null"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        class="icon-btn"
        [class.icon-btn--danger]="variant() === 'danger'"
        [type]="type()"
        [disabled]="disabled()"
        [matTooltip]="tooltip()"
        [attr.aria-label]="ariaLabel() || tooltip() || null"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }
  `,
  styleUrl: './icon-button.component.scss',
})
export class IconButtonComponent {
  readonly variant = input<IconButtonVariant>('default');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly tooltip = input('');
  readonly ariaLabel = input('');
  readonly link = input<string | readonly (string | number)[]>();
}
