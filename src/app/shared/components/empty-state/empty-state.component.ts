import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type EmptyStateVariant = 'loading' | 'empty' | 'no-results';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (variant()) {
      @case ('loading') {
        <div class="state-card">
          <mat-spinner [diameter]="48" />
          <p class="state-card__text"><ng-content /></p>
        </div>
      }
      @case ('empty') {
        <div class="empty-card">
          @if (icon()) {
            <div class="empty-card__icon" aria-hidden="true">
              <mat-icon>{{ icon() }}</mat-icon>
            </div>
          }
          <h2 class="empty-card__title">{{ title() }}</h2>
          @if (description()) {
            <p class="empty-card__text">{{ description() }}</p>
          }
          <ng-content select="[actions]" />
        </div>
      }
      @default {
        <div class="state-card">
          @if (icon()) {
            <mat-icon class="state-card__icon" aria-hidden="true">{{ icon() }}</mat-icon>
          }
          <p class="state-card__text"><ng-content /></p>
        </div>
      }
    }
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly variant = input<EmptyStateVariant>('empty');
  readonly icon = input('');
  readonly title = input('');
  readonly description = input('');
}
