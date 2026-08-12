import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UsersService } from '../../../core/services/users.service';
import { ApiError } from '../../../core/models/api-error.model';
import { UserStatus } from '../../../core/models/user-status.model';
import {
  ToggleStatusDialogData,
  ToggleStatusDialogResult,
} from '../../../core/models/toggle-status-dialog.models';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-toggle-status-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, AlertComponent, ButtonComponent],
  templateUrl: './toggle-status-dialog.component.html',
  styleUrl: './toggle-status-dialog.component.scss',
})
export class ToggleStatusDialogComponent {
  protected readonly data = inject<ToggleStatusDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<ToggleStatusDialogComponent, ToggleStatusDialogResult>>(MatDialogRef);
  private readonly usersService = inject(UsersService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorBlocksAction = signal(false);

  protected readonly isDeactivate = computed(() => this.data.action === 'deactivate');

  protected readonly title = computed(() =>
    this.isDeactivate() ? '¿Desactivar usuario?' : '¿Activar usuario?',
  );

  protected readonly secondaryMessage = computed(() =>
    this.isDeactivate()
      ? 'El usuario no podrá acceder al sistema. Sus documentos permanecerán disponibles.'
      : 'El usuario podrá volver a acceder al sistema.',
  );

  protected readonly actionLabel = computed(() => (this.isDeactivate() ? 'Desactivar' : 'Activar'));

  protected readonly actionDisabled = computed(() => this.loading() || this.errorBlocksAction());

  confirm(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.dialogRef.disableClose = true;

    const newStatus: UserStatus = this.isDeactivate() ? 'INACTIVE' : 'ACTIVE';

    this.usersService.updateStatus(this.data.user.id, newStatus).subscribe({
      next: (res) => {
        this.dialogRef.close({ success: true, message: res.message });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.dialogRef.disableClose = false;
        this.handleError(err);
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  private handleError(err: HttpErrorResponse): void {
    const apiError = err.error as ApiError | undefined;
    if (err.status === 403) {
      this.errorMessage.set(apiError?.message ?? 'No puedes desactivar tu propia cuenta');
      this.errorBlocksAction.set(true);
    } else {
      this.errorMessage.set('Ocurrió un error inesperado. Por favor, inténtalo de nuevo');
      this.errorBlocksAction.set(false);
    }
  }
}
