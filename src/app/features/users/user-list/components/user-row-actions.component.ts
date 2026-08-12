import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../../core/models/user.model';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';

@Component({
  selector: 'app-user-row-actions',
  standalone: true,
  imports: [MatIconModule, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row-actions">
      <app-icon-button tooltip="Editar" ariaLabel="Editar usuario" (click)="edit.emit(user())">
        <mat-icon>edit</mat-icon>
      </app-icon-button>

      @if (user().status === 'ACTIVE') {
        <app-icon-button
          tooltip="Desactivar"
          ariaLabel="Desactivar usuario"
          (click)="toggleStatus.emit(user())"
        >
          <mat-icon>lock</mat-icon>
        </app-icon-button>
      } @else {
        <app-icon-button
          tooltip="Activar"
          ariaLabel="Activar usuario"
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
