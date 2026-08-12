import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '../../../../core/models/category.model';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';

@Component({
  selector: 'app-category-row-actions',
  standalone: true,
  imports: [MatIconModule, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row-actions">
      @if (category().status === 'ACTIVE') {
        <app-icon-button
          tooltip="Editar"
          ariaLabel="Editar categoría"
          (click)="edit.emit(category())"
        >
          <mat-icon>edit</mat-icon>
        </app-icon-button>
        <app-icon-button
          variant="danger"
          tooltip="Desactivar"
          ariaLabel="Desactivar categoría"
          (click)="toggleStatus.emit(category())"
        >
          <mat-icon>delete_outline</mat-icon>
        </app-icon-button>
      } @else {
        <app-icon-button
          tooltip="Activar"
          ariaLabel="Activar categoría"
          (click)="toggleStatus.emit(category())"
        >
          <mat-icon>restart_alt</mat-icon>
        </app-icon-button>
      }
    </div>
  `,
  styleUrl: './category-row-actions.component.scss',
})
export class CategoryRowActionsComponent {
  readonly category = input.required<Category>();

  readonly edit = output<Category>();
  readonly toggleStatus = output<Category>();
}
