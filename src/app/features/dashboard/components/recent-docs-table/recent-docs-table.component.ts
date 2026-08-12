import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RecentDocumentItem } from '../../../../core/models/dashboard-stats.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { DocumentFormatIconComponent } from '../../../documents/document-list/components/document-format-icon.component';
import { DocumentCategoryPillComponent } from '../../../documents/document-list/components/document-category-pill.component';

function truncateTitle(title: string, max = 50): string {
  return title.length > max ? title.slice(0, max - 1) + '…' : title;
}

function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

@Component({
  selector: 'app-recent-docs-table',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    EmptyStateComponent,
    IconButtonComponent,
    DocumentFormatIconComponent,
    DocumentCategoryPillComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recent-docs-table.component.html',
  styleUrl: './recent-docs-table.component.scss',
})
export class RecentDocsTableComponent {
  readonly documents = input.required<RecentDocumentItem[]>();
  readonly repoIsEmpty = input(false);
  readonly canUpload = input(false);

  readonly view = output<number>();
  readonly download = output<RecentDocumentItem>();
  readonly uploadFirst = output<void>();

  protected readonly truncateTitle = truncateTitle;
  protected readonly formatCreatedAt = formatCreatedAt;
}
