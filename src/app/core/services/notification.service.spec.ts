import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const snackBar = { dismiss: vi.fn(), openFromComponent: vi.fn() };
  let service: NotificationService;

  beforeEach(() => {
    snackBar.dismiss.mockReset();
    snackBar.openFromComponent.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: snackBar },
        { provide: BreakpointObserver, useValue: { isMatched: () => false } },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it.each(['info', 'success', 'warning', 'error'] as const)(
    '%s abre el toast con su tipo, título y descripción',
    (type) => {
      service[type]('Título', 'Descripción');

      expect(snackBar.openFromComponent).toHaveBeenCalledWith(
        ToastComponent,
        expect.objectContaining({
          data: { type, title: 'Título', description: 'Descripción' },
          duration: 5000,
          verticalPosition: 'top',
          panelClass: ['docu-toast-panel', `docu-toast-panel--${type}`],
        }),
      );
    },
  );

  it('cierra el toast anterior antes de abrir uno nuevo', () => {
    service.success('Uno');
    service.error('Dos');

    expect(snackBar.dismiss).toHaveBeenCalledTimes(2);
    expect(snackBar.dismiss.mock.invocationCallOrder[1]).toBeLessThan(
      snackBar.openFromComponent.mock.invocationCallOrder[1],
    );
  });
});
