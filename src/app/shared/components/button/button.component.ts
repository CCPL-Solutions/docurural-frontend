import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';

@Component({
  selector: 'app-button',
  imports: [MatProgressSpinnerModule, NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Con `link` se renderiza un enlace (navegación pura, RUT-01); si no, un botón.
  template: `
    <ng-template #content><ng-content /></ng-template>
    @if (link(); as link) {
      <a class="btn" [class]="btnClass()" [routerLink]="link">
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        class="btn"
        [class]="btnClass()"
        [type]="type()"
        [disabled]="disabled() || loading()"
        [attr.aria-busy]="loading() || null"
      >
        @if (loading()) {
          <mat-progress-spinner class="btn__spinner" [diameter]="18" mode="indeterminate" />
        }
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly fullWidth = input(false);
  readonly link = input<string | readonly (string | number)[]>();

  protected readonly btnClass = computed(() => {
    const classes = [`btn--${this.variant()}`];
    if (this.loading()) classes.push('btn--loading');
    if (this.fullWidth()) classes.push('btn--full');
    return classes.join(' ');
  });
}
