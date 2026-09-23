import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { DocumentFilters, EMPTY_FILTERS } from '../../../../../core/models/document-filters.model';
import { FilterOptionsResponse } from '../../../../../core/models/filter-options.model';
import { formatYmd } from '../../utils/format-ymd';

const FILTER_DATE_FORMATS = {
  parse: {
    dateInput: { day: 'numeric', month: 'numeric', year: 'numeric' },
  },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

@Component({
  selector: 'app-document-filters-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: FILTER_DATE_FORMATS }],
  templateUrl: './document-filters-panel.component.html',
  styleUrl: './document-filters-panel.component.scss',
})
export class DocumentFiltersPanelComponent {
  readonly draft = input<DocumentFilters>(EMPTY_FILTERS);
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

  parseDateStr(ymd: string | null): Date | null {
    if (!ymd) return null;
    const [year, month, day] = ymd.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }
}
