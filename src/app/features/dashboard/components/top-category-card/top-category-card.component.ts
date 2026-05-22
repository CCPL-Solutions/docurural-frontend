import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TopCategory } from '../../../../core/models/dashboard-stats.model';

@Component({
  selector: 'app-top-category-card',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './top-category-card.component.html',
  styleUrl: './top-category-card.component.scss',
})
export class TopCategoryCardComponent {
  readonly category = input<TopCategory | null>(null);
  readonly total    = input.required<number>();

  protected readonly percentage = computed(() => {
    const cat = this.category();
    const tot = this.total();
    if (!cat || !tot) return 0;
    return Math.round((cat.count / tot) * 100);
  });
}
