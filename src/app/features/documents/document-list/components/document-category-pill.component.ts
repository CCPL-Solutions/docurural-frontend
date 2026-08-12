import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface PillColor {
  bg: string;
  fg: string;
  dot: string;
}

const PILL_PALETTE: PillColor[] = [
  { bg: '#EBF3FB', fg: '#1E4F7A', dot: '#2E6DA4' },
  { bg: '#F3EAF8', fg: '#5B2779', dot: '#8E4FB8' },
  { bg: '#E6F4E7', fg: '#276B2B', dot: '#3A8A3F' },
  { bg: '#FDF3DF', fg: '#8A5E10', dot: '#E8A020' },
  { bg: '#E5F1F7', fg: '#1A5570', dot: '#3A8AAE' },
  { bg: '#FBEAE7', fg: '#8F2A20', dot: '#C0392B' },
  { bg: '#F4F6F8', fg: '#4A5A6E', dot: '#6B7A8D' },
];

function pillColor(name: string): PillColor {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % PILL_PALETTE.length;
  }
  return PILL_PALETTE[h];
}

@Component({
  selector: 'app-document-category-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="category-pill" [style.background]="color().bg" [style.color]="color().fg">
      <span class="category-pill__dot" [style.background]="color().dot" aria-hidden="true"></span>
      <span class="category-pill__label">{{ name() }}</span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .category-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        padding: 3px 10px;
        border-radius: 9999px;
        line-height: 1.4;
        white-space: nowrap;
        max-width: 100%;
      }

      .category-pill__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .category-pill__label {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
})
export class DocumentCategoryPillComponent {
  readonly name = input.required<string>();

  protected readonly color = computed(() => pillColor(this.name()));
}
