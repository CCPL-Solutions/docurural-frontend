import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { categoryColor } from '../utils/category-color';

@Component({
  selector: 'app-category-icon-badge',
  standalone: true,
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

  protected readonly colors = computed(() => categoryColor(this.name(), this.muted()));
}
