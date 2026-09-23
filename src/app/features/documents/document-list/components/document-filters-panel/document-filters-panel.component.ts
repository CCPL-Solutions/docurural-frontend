import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { DocumentFilters, EMPTY_FILTERS } from '../../document-filters.model';
import { FilterOptionsResponse } from '@core/models/filter-options.model';
import { formatYmd } from '@shared/utils/format-ymd';
import { parseYmd } from '@shared/utils/parse-date';

@Component({
  selector: 'app-document-filters-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule],
  templateUrl: './document-filters-panel.component.html',
  styleUrl: './document-filters-panel.component.scss',
})
export class DocumentFiltersPanelComponent {
  readonly draft = input<DocumentFilters>(EMPTY_FILTERS);
  protected readonly parseYmd = parseYmd;
  readonly options = input<FilterOptionsResponse | null>(null);
  readonly canSeeUploadedBy = input(false);
  readonly dateError = input<string | null>(null);
  readonly loadingOptions = input(false);

  readonly draftChange = output<DocumentFilters>();
  readonly apply = output<DocumentFilters>();
  readonly resetFilters = output<void>();
  readonly closePanel = output<void>();

  onCategoryChange(value: number | null): void {
    this.draftChange.emit({ ...this.draft(), categoryId: value });
  }

  onResponsibleAreaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.draftChange.emit({ ...this.draft(), responsibleArea: input.value.trim() || null });
  }

  onDateFromChange(event: MatDatepickerInputEvent<Date>): void {
    this.draftChange.emit({
      ...this.draft(),
      dateFrom: event.value ? formatYmd(event.value) : null,
    });
  }

  onDateToChange(event: MatDatepickerInputEvent<Date>): void {
    this.draftChange.emit({ ...this.draft(), dateTo: event.value ? formatYmd(event.value) : null });
  }

  onUploadedByChange(value: number | null): void {
    this.draftChange.emit({ ...this.draft(), uploadedBy: value });
  }

  onApply(): void {
    this.apply.emit(this.draft());
  }

  onReset(): void {
    this.resetFilters.emit();
  }

  onClose(): void {
    this.closePanel.emit();
  }
}
