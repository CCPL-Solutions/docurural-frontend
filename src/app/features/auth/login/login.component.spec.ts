import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '@env/environment';
import { NotificationService } from '@core/services/notification.service';
import { LoginComponent } from './login.component';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class BlankComponent {}

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

  it('tras iniciar sesión vuelve a la URL original con todos sus query params (R7)', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: LoginComponent },
          { path: 'documents', component: BlankComponent },
        ]),
        { provide: NotificationService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login?returnUrl=%2Fdocuments%3Fq%3Dacta%26page%3D2');
    const host = harness.routeNativeElement!;
    for (const [id, value] of [
      ['email', 'ana@ierd.edu.co'],
      ['password', 'secreta'],
    ]) {
      const input = host.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    host.querySelector('form')!.dispatchEvent(new Event('submit'));

    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush({
        token: 'jwt',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { id: 1, fullName: 'Ana Pérez', email: 'ana@ierd.edu.co', role: 'ADMIN' },
      });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/documents?q=acta&page=2');
  });
});
