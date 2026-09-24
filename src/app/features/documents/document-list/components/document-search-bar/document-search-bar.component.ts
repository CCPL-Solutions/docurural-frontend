import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-document-search-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './document-search-bar.component.html',
  styleUrl: './document-search-bar.component.scss',
})
export class DocumentSearchBarComponent {
  readonly value = input('');
  readonly disabled = input(false);
  readonly error = input<string | null>(null);
  readonly filtersOpen = input(false);
  readonly filtersCount = input(0);

  readonly valueChange = output<string>();
  readonly searchSubmit = output<void>();
  readonly clear = output<void>();
  readonly toggleFilters = output<void>();

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.valueChange.emit(input.value);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.searchSubmit.emit();
  }
}
