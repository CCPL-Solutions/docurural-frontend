import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly fullWidth = input(false);

  protected readonly btnClass = computed(() => {
    const classes = [`btn--${this.variant()}`];
    if (this.loading()) classes.push('btn--loading');
    if (this.fullWidth()) classes.push('btn--full');
    return classes.join(' ');
  });
}
