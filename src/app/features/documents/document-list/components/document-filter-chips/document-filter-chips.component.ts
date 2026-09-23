import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FilterChipDescriptor } from '../../document-filters.model';

@Component({
  selector: 'app-document-filter-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './document-filter-chips.component.html',
  styleUrl: './document-filter-chips.component.scss',
})
export class DocumentFilterChipsComponent {
  readonly chips = input<FilterChipDescriptor[]>([]);
  readonly showClearAll = input(false);

  readonly remove = output<FilterChipDescriptor['key']>();
  readonly clearAll = output<void>();
}
