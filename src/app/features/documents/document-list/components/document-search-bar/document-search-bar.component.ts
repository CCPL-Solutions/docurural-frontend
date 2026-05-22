import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-document-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './document-search-bar.component.html',
  styleUrl: './document-search-bar.component.scss',
})
export class DocumentSearchBarComponent {
  @Input() value = '';
  @Input() disabled = false;
  @Input() error: string | null = null;
  @Input() filtersOpen = false;
  @Input() filtersCount = 0;

  @Output() readonly valueChange   = new EventEmitter<string>();
  @Output() readonly submit        = new EventEmitter<void>();
  @Output() readonly clear         = new EventEmitter<void>();
  @Output() readonly toggleFilters = new EventEmitter<void>();

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.valueChange.emit(input.value);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.submit.emit();
  }
}
