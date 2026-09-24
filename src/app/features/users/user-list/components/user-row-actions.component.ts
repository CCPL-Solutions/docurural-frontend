import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { User } from '@core/models/user.model';
import { IconButtonComponent } from '@shared/components/icon-button/icon-button.component';

@Component({
  selector: 'app-user-row-actions',
  imports: [MatIconModule, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row-actions">
      <app-icon-button
        tooltip="Editar"
        i18n-tooltip="@@common.edit"
        ariaLabel="Editar usuario"
        i18n-ariaLabel="@@users.row.editAriaLabel"
        (click)="edit.emit(user())"
      >
        <mat-icon>edit</mat-icon>
      </app-icon-button>

      @if (user().status === 'ACTIVE') {
        <app-icon-button
          tooltip="Desactivar"
          i18n-tooltip="@@users.action.deactivate"
          ariaLabel="Desactivar usuario"
          i18n-ariaLabel="@@users.row.deactivateAriaLabel"
          (click)="toggleStatus.emit(user())"
        >
          <mat-icon>lock</mat-icon>
        </app-icon-button>
      } @else {
        <app-icon-button
          tooltip="Activar"
          i18n-tooltip="@@users.action.activate"
          ariaLabel="Activar usuario"
          i18n-ariaLabel="@@users.row.activateAriaLabel"
          (click)="toggleStatus.emit(user())"
        >
          <mat-icon>lock_open</mat-icon>
        </app-icon-button>
      }
    </div>
  `,
  styleUrl: './user-row-actions.component.scss',
})
export class UserRowActionsComponent {
  readonly user = input.required<User>();

  readonly edit = output<User>();
  readonly toggleStatus = output<User>();
}
