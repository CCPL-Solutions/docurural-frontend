import { Injectable, Injector, inject } from '@angular/core';
import type { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import type {
  ToastComponent,
  ToastData,
  ToastType,
} from '@shared/components/toast/toast.component';

interface ToastRenderer {
  snackBar: MatSnackBar;
  toast: typeof ToastComponent;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly injector = inject(Injector);

  // El snackbar y el toast se cargan con el primer aviso, no al arrancar: el interceptor inyecta
  // este servicio, y cargarlos de forma estática metía en el bundle inicial el overlay del CDK y
  // los módulos de Material que usa el snackbar (tarea 4.10).
  private renderer?: Promise<ToastRenderer>;

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
    const config: MatSnackBarConfig<ToastData> = {
      data: { type, title, description },
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: ['docu-toast-panel', `docu-toast-panel--${type}`],
    };

    // Los avisos se muestran en el orden en que se piden: comparten la misma promesa.
    void this.loadRenderer().then(({ snackBar, toast }) => {
      snackBar.dismiss();
      snackBar.openFromComponent(toast, config);
    });
  }

  private loadRenderer(): Promise<ToastRenderer> {
    this.renderer ??= Promise.all([
      import('@angular/material/snack-bar'),
      import('@shared/components/toast/toast.component'),
    ]).then(([snackBarModule, toastModule]) => ({
      snackBar: this.injector.get(snackBarModule.MatSnackBar),
      toast: toastModule.ToastComponent,
    }));
    return this.renderer;
  }
}
