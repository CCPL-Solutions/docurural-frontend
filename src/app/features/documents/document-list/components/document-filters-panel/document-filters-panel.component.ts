import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { DocumentFilters } from '../../../../../core/models/document-filters.model';
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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: FILTER_DATE_FORMATS }],
  templateUrl: './document-filters-panel.component.html',
  styleUrl: './document-filters-panel.component.scss',
})
export class DocumentFiltersPanelComponent {
  @Input() draft: DocumentFilters = {
    categoryId: null,
    responsibleArea: null,
    dateFrom: null,
    dateTo: null,
    uploadedBy: null,
  };
  @Input() options: FilterOptionsResponse | null = null;
  @Input() canSeeUploadedBy = false;
  @Input() dateError: string | null = null;
  @Input() loadingOptions = false;

  @Output() readonly draftChange = new EventEmitter<DocumentFilters>();
  @Output() readonly apply = new EventEmitter<DocumentFilters>();
  @Output() readonly reset = new EventEmitter<void>();
  @Output() readonly close = new EventEmitter<void>();

  onCategoryChange(value: number | null): void {
    this.draftChange.emit({ ...this.draft, categoryId: value });
  }

  onResponsibleAreaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.draftChange.emit({ ...this.draft, responsibleArea: input.value.trim() || null });
  }

  onDateFromChange(event: MatDatepickerInputEvent<Date>): void {
    this.draftChange.emit({ ...this.draft, dateFrom: event.value ? formatYmd(event.value) : null });
  }

  onDateToChange(event: MatDatepickerInputEvent<Date>): void {
    this.draftChange.emit({ ...this.draft, dateTo: event.value ? formatYmd(event.value) : null });
  }

  onUploadedByChange(value: number | null): void {
    this.draftChange.emit({ ...this.draft, uploadedBy: value });
  }

  onApply(): void {
    this.apply.emit(this.draft);
  }

  onReset(): void {
    this.reset.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  parseDateStr(ymd: string | null): Date | null {
    if (!ymd) return null;
    const [year, month, day] = ymd.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }
}
