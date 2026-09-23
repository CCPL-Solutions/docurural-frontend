import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const snackBar = { dismiss: vi.fn(), openFromComponent: vi.fn() };
  let service: NotificationService;

  beforeEach(() => {
    snackBar.dismiss.mockReset();
    snackBar.openFromComponent.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: snackBar }],
    });
    service = TestBed.inject(NotificationService);
  });

  it.each(['info', 'success', 'warning', 'error'] as const)(
    '%s abre el toast con su tipo, título y descripción',
    async (type) => {
      service[type]('Título', 'Descripción');

      // El snackbar y el toast se cargan con el primer aviso (import dinámico).
      await vi.waitFor(() => expect(snackBar.openFromComponent).toHaveBeenCalled());
      expect(snackBar.openFromComponent).toHaveBeenCalledWith(
        ToastComponent,
        expect.objectContaining({
          data: { type, title: 'Título', description: 'Descripción' },
          duration: 5000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['docu-toast-panel', `docu-toast-panel--${type}`],
        }),
      );
    },
  );

  it('cierra el toast anterior antes de abrir uno nuevo y respeta el orden', async () => {
    service.success('Uno');
    service.error('Dos');

    await vi.waitFor(() => expect(snackBar.openFromComponent).toHaveBeenCalledTimes(2));
    expect(snackBar.dismiss).toHaveBeenCalledTimes(2);
    expect(snackBar.openFromComponent.mock.calls.map(([, config]) => config.data.title)).toEqual([
      'Uno',
      'Dos',
    ]);
    expect(snackBar.dismiss.mock.invocationCallOrder[1]).toBeLessThan(
      snackBar.openFromComponent.mock.invocationCallOrder[1],
    );
  });
});
