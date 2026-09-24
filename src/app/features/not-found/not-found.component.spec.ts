import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@core/services/auth.service';
import { routes } from '../../app.routes';
import { NotFoundComponent } from './not-found.component';

describe('Ruta ** (404)', () => {
  let harness: RouterTestingHarness;

  async function setup(authenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => authenticated, currentUser: () => null },
        },
      ],
    });
    harness = await RouterTestingHarness.create();
  }

  it('sin sesión, una URL desconocida muestra la página 404 y no el login', async () => {
    await setup(false);

    const page = await harness.navigateByUrl('/no-existe/de-verdad', NotFoundComponent);

    expect(page).toBeInstanceOf(NotFoundComponent);
    expect(TestBed.inject(Router).url).toBe('/no-existe/de-verdad');
    expect(harness.routeNativeElement?.textContent).toContain('Página no encontrada');
  });

  it('enlaza al inicio', async () => {
    await setup(true);

    await harness.navigateByUrl('/no-existe', NotFoundComponent);

    const link = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a');
    expect(link?.getAttribute('href')).toBe('/dashboard');
    expect(link?.textContent).toContain('Ir al inicio');
  });
});
