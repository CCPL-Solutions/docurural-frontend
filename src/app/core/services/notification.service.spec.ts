import { HttpErrorResponse } from '@angular/common/http';
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

  describe('httpError', () => {
    const titles = () => snackBar.openFromComponent.mock.calls.map(([, config]) => config.data);

    it('muestra el mensaje del backend', async () => {
      const err = new HttpErrorResponse({ status: 409, error: { message: 'Ya existe' } });
      service.httpError(err, 'No se pudo guardar', 'Inténtelo de nuevo');

      await vi.waitFor(() => expect(snackBar.openFromComponent).toHaveBeenCalled());
      expect(titles()).toEqual([
        { type: 'error', title: 'No se pudo guardar', description: 'Ya existe' },
      ]);
    });

    it('lee el mensaje de un cuerpo Blob (descargas)', async () => {
      const blob = new Blob([JSON.stringify({ message: 'No existe el archivo' })]);
      service.httpError(new HttpErrorResponse({ status: 404, error: blob }), 'Error', 'x');

      await vi.waitFor(() => expect(snackBar.openFromComponent).toHaveBeenCalled());
      expect(titles()[0].description).toBe('No existe el archivo');
    });

    it('usa el texto alternativo si el backend no envía mensaje', async () => {
      service.httpError(new HttpErrorResponse({ status: 0 }), 'Sin conexión', 'Revise la red');

      await vi.waitFor(() => expect(snackBar.openFromComponent).toHaveBeenCalled());
      expect(titles()[0].description).toBe('Revise la red');
    });

    it('ignora el 401: el toast lo muestra el interceptor (R1)', async () => {
      service.httpError(new HttpErrorResponse({ status: 401 }), 'No se pudo cargar', 'x');
      service.info('Después');

      await vi.waitFor(() => expect(snackBar.openFromComponent).toHaveBeenCalled());
      expect(titles().map((d) => d.title)).toEqual(['Después']);
    });
  });

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
