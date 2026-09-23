import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { NotificationService } from '@core/services/notification.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotificationService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });
  });

  async function submitWith(email: string, password: string) {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const type = (id: string, value: string) => {
      const input = host.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    type('email', email);
    type('password', password);
    // Enviar con Enter sin salir del campo: los controles no están "touched" (R9).
    host.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    return { fixture, host };
  }

  it('muestra el error de campo del backend (R9, R12)', async () => {
    const { fixture, host } = await submitWith('ana@ierd.edu.co', 'secreta');

    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush(
        {
          timestamp: 't',
          status: 400,
          error: 'Bad Request',
          message: 'Datos inválidos',
          fieldErrors: { email: 'El dominio del correo no está permitido' },
        },
        { status: 400, statusText: 'Bad Request' },
      );
    await fixture.whenStable();

    expect(host.textContent).toContain('El dominio del correo no está permitido');
  });

  it('con credenciales incorrectas muestra la alerta general', async () => {
    const { fixture, host } = await submitWith('ana@ierd.edu.co', 'mala');

    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(host.textContent).toContain('Correo o contraseña incorrectos');
  });
});
