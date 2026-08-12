import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  ToastComponent,
  ToastData,
  ToastType,
} from '../../shared/components/toast/toast.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);

  info(title: string, description?: string): void {
    this.show('info', title, description);
  }

  success(title: string, description?: string): void {
    this.show('success', title, description);
  }

  warning(title: string, description?: string): void {
    this.show('warning', title, description);
  }

  error(title: string, description?: string): void {
    this.show('error', title, description);
  }

  private show(type: ToastType, title: string, description?: string): void {
    this.snackBar.dismiss();

    const isHandset = this.breakpointObserver.isMatched([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape,
    ]);

    const config: MatSnackBarConfig<ToastData> = {
      data: { type, title, description },
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: isHandset ? 'center' : 'center',
      panelClass: ['docu-toast-panel', `docu-toast-panel--${type}`],
    };

    this.snackBar.openFromComponent(ToastComponent, config);
  }
}
