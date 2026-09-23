import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RecentDocumentItem } from '@core/models/dashboard-stats.model';
import { ButtonComponent } from '@shared/components/button/button.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '@shared/components/icon-button/icon-button.component';
import { DocumentFormatIconComponent } from '@shared/components/document-format-icon/document-format-icon.component';
import { CategoryPillComponent } from '@shared/components/category-pill/category-pill.component';
import { DatePipe } from '@angular/common';
import { SHORT_DATE_FORMAT } from '@shared/utils/date-formats';

function truncateTitle(title: string, max = 50): string {
  return title.length > max ? title.slice(0, max - 1) + '…' : title;
}

@Component({
  selector: 'app-recent-docs-table',
  imports: [
    MatProgressSpinnerModule,
    ButtonComponent,
    DatePipe,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    EmptyStateComponent,
    IconButtonComponent,
    DocumentFormatIconComponent,
    CategoryPillComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recent-docs-table.component.html',
  styleUrl: './recent-docs-table.component.scss',
})
export class RecentDocsTableComponent {
  readonly documents = input.required<RecentDocumentItem[]>();
  readonly repoIsEmpty = input(false);
  readonly canUpload = input(false);
  readonly downloadingIds = input<ReadonlySet<number>>(new Set());

  readonly view = output<number>();
  readonly download = output<RecentDocumentItem>();
  readonly uploadFirst = output<void>();

  protected readonly truncateTitle = truncateTitle;
  protected readonly dateFormat = SHORT_DATE_FORMAT;
}
