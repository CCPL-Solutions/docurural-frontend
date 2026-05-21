import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import {
  DocumentFilters,
  EMPTY_FILTERS,
} from '../../../../../core/models/document-filters.model';
import { FilterOptionsResponse } from '../../../../../core/models/filter-options.model';
import { DocumentFiltersPanelComponent } from '../document-filters-panel/document-filters-panel.component';

export interface FiltersBottomSheetData {
  draft:             DocumentFilters;
  options:           FilterOptionsResponse | null;
  canSeeUploadedBy:  boolean;
  loadingOptions:    boolean;
}

export type FiltersBottomSheetResult =
  | { action: 'apply'; draft: DocumentFilters }
  | undefined;

@Component({
  selector: 'app-document-filters-bottom-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DocumentFiltersPanelComponent],
  templateUrl: './document-filters-bottom-sheet.component.html',
  styleUrl: './document-filters-bottom-sheet.component.scss',
})
export class DocumentFiltersBottomSheetComponent {
  protected readonly data = inject<FiltersBottomSheetData>(MAT_BOTTOM_SHEET_DATA);
  private  readonly ref  =
    inject<MatBottomSheetRef<DocumentFiltersBottomSheetComponent, FiltersBottomSheetResult>>(MatBottomSheetRef);

  protected readonly draft         = signal<DocumentFilters>({ ...this.data.draft });
  protected readonly dateRangeError = signal<string | null>(null);

  protected onDraftChange(d: DocumentFilters): void {
    this.draft.set(d);
    if (d.dateFrom && d.dateTo) {
      this.dateRangeError.set(d.dateFrom > d.dateTo
        ? 'La fecha de inicio no puede ser posterior a la fecha de fin.'
        : null);
    } else {
      this.dateRangeError.set(null);
    }
  }

  protected onApply(draft: DocumentFilters): void {
    if (this.dateRangeError()) return;
    this.ref.dismiss({ action: 'apply', draft });
  }

  protected onReset(): void {
    this.draft.set({ ...EMPTY_FILTERS });
    this.dateRangeError.set(null);
  }

  protected onClose(): void {
    this.ref.dismiss();
  }
}
