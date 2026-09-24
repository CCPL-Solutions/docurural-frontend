import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { nameColor } from '@shared/utils/name-color';

@Component({
  selector: 'app-category-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="category-pill" [style.background]="color().bg" [style.color]="color().fg">
      <span class="category-pill__dot" [style.background]="color().dot" aria-hidden="true"></span>
      <span class="category-pill__label">{{ name() }}</span>
    </span>
  `,
  styleUrl: './category-pill.component.scss',
})
export class CategoryPillComponent {
  readonly name = input.required<string>();

  protected readonly color = computed(() => nameColor(this.name()));
}
