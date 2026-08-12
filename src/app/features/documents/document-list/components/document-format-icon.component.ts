import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DocumentFormat } from '../../../../core/models/document-format.model';
import { FORMAT_STYLE } from '../utils/document-format';

@Component({
  selector: 'app-document-format-icon',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="format-icon" [style.background]="style().bg" [style.color]="style().fg">
      <mat-icon aria-hidden="true">{{ style().matIcon }}</mat-icon>
      <span class="format-icon__badge" [style.background]="style().dot">{{ format() }}</span>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        flex-shrink: 0;
      }

      .format-icon {
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .format-icon__badge {
        position: absolute;
        bottom: -4px;
        right: -4px;
        font-size: 8px;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 3px;
        color: #fff;
        letter-spacing: 0.04em;
        line-height: 1.4;
        white-space: nowrap;
      }
    `,
  ],
})
export class DocumentFormatIconComponent {
  readonly format = input.required<DocumentFormat>();

  protected readonly style = computed(() => FORMAT_STYLE[this.format()] ?? FORMAT_STYLE['PDF']);
}
