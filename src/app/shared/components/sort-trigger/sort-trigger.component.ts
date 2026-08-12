import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

export interface SortOptionItem {
  value: string;
  label: string;
}

@Component({
  selector: 'app-sort-trigger',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatMenuModule],
  // Los estilos de .sort-trigger son globales (_list-view.scss) — no styleUrl necesario.
  template: `
    <button
      type="button"
      class="sort-trigger"
      [matMenuTriggerFor]="menu"
      [disabled]="disabled()"
      aria-label="Ordenar listado"
    >
      <mat-icon class="sort-trigger__icon" aria-hidden="true">swap_vert</mat-icon>
      <span class="sort-trigger__label">
        <span class="sort-trigger__prefix">Ordenar:</span>
        {{ activeLabel() }}
      </span>
      <mat-icon class="sort-trigger__chevron" aria-hidden="true">expand_more</mat-icon>
    </button>

    <mat-menu #menu="matMenu" panelClass="sort-menu" xPosition="before">
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          mat-menu-item
          [class.sort-menu__item--active]="activeValue() === opt.value"
          (click)="onSelect(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </mat-menu>
  `,
})
export class SortTriggerComponent {
  readonly options = input.required<SortOptionItem[]>();
  readonly activeValue = input<string>('');
  readonly disabled = input<boolean>(false);

  readonly sortChange = output<string>();

  protected readonly activeLabel = computed(
    () => this.options().find((o) => o.value === this.activeValue())?.label ?? '',
  );

  protected onSelect(value: string): void {
    this.sortChange.emit(value);
  }
}
