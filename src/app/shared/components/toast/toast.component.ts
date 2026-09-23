import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastData {
  type: ToastType;
  title: string;
  description?: string;
}

const ICON_BY_TYPE: Record<ToastType, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'cancel',
};

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  host: {
    class: 'toast',
    '[class.toast--info]': 'data.type === "info"',
    '[class.toast--success]': 'data.type === "success"',
    '[class.toast--warning]': 'data.type === "warning"',
    '[class.toast--error]': 'data.type === "error"',
    role: 'status',
  },
})
export class ToastComponent {
  protected readonly data: ToastData = inject(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject(MatSnackBarRef);

  protected get icon(): string {
    return ICON_BY_TYPE[this.data.type];
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
