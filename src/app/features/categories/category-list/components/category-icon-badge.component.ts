import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { nameColor } from '@shared/utils/name-color';

@Component({
  selector: 'app-category-icon-badge',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="icon-badge" [style.background]="colors().bg" [style.color]="colors().fg">
      <mat-icon aria-hidden="true">local_offer</mat-icon>
    </div>
  `,
  styleUrl: './category-icon-badge.component.scss',
})
export class CategoryIconBadgeComponent {
  readonly name = input.required<string>();
  readonly muted = input(false);

  protected readonly colors = computed(() => nameColor(this.name(), this.muted()));
}
