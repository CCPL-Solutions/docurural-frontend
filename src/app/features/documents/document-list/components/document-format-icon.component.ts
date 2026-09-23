import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DocumentFormat } from '@core/models/document-format.model';
import { FORMAT_STYLE } from '../utils/document-format';

@Component({
  selector: 'app-document-format-icon',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="format-icon" [style.background]="style().bg" [style.color]="style().fg">
      <mat-icon aria-hidden="true">{{ style().matIcon }}</mat-icon>
      <span class="format-icon__badge" [style.background]="style().dot">{{ format() }}</span>
    </div>
  `,
  styleUrl: './document-format-icon.component.scss',
})
export class DocumentFormatIconComponent {
  readonly format = input.required<DocumentFormat>();

  protected readonly style = computed(() => FORMAT_STYLE[this.format()] ?? FORMAT_STYLE['PDF']);
}
