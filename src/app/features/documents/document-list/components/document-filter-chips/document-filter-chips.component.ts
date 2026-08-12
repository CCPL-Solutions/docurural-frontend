import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FilterChipDescriptor } from '../../../../../core/models/document-filters.model';

@Component({
  selector: 'app-document-filter-chips',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './document-filter-chips.component.html',
  styleUrl: './document-filter-chips.component.scss',
})
export class DocumentFilterChipsComponent {
  @Input() chips: FilterChipDescriptor[] = [];
  @Input() showClearAll = false;

  @Output() readonly remove = new EventEmitter<FilterChipDescriptor['key']>();
  @Output() readonly clearAll = new EventEmitter<void>();
}
