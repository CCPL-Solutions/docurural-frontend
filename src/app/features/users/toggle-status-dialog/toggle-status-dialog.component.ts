import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UsersService } from '@core/services/users.service';
import { User } from '@core/models/user.model';
import { UserStatus } from '@core/models/user-status.model';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { toApiError } from '@shared/http/api-error';

export interface ToggleStatusDialogData {
  user: User;
  action: 'activate' | 'deactivate';
}

export interface ToggleStatusDialogResult {
  success: true;
  message: string;
}

@Component({
  selector: 'app-toggle-status-dialog',
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
  private readonly destroyRef = inject(DestroyRef);

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

    this.usersService
      .updateStatus(this.data.user.id, newStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    if (err.status === HttpStatusCode.Forbidden) {
      this.errorMessage.set(toApiError(err)?.message ?? 'No puede desactivar su propia cuenta');
      this.errorBlocksAction.set(true);
    } else {
      this.errorMessage.set('Ocurrió un error inesperado. Por favor, inténtelo de nuevo');
      this.errorBlocksAction.set(false);
    }
  }
}
