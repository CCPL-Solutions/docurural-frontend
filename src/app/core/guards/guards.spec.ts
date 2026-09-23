import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthenticatedUser } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { roleGuard } from './role.guard';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class BlankComponent {}

describe('guards', () => {
  const isAuthenticated = signal(false);
  const currentUser = signal<AuthenticatedUser | null>(null);
  const notifications = { error: vi.fn() };
  let harness: RouterTestingHarness;
  let router: Router;

  const user = (role: AuthenticatedUser['role']): AuthenticatedUser => ({
    id: 1,
    fullName: 'Ana Pérez',
    email: 'ana@ierd.edu.co',
    role,
  });

  beforeEach(async () => {
    isAuthenticated.set(false);
    currentUser.set(null);
    notifications.error.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', canActivate: [guestGuard], component: BlankComponent },
          { path: 'dashboard', component: BlankComponent },
          { path: 'documents', canActivate: [authGuard], component: BlankComponent },
          { path: 'users', canActivate: [roleGuard(['ADMIN'])], component: BlankComponent },
        ]),
        { provide: AuthService, useValue: { isAuthenticated, currentUser } },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('deja pasar con sesión', async () => {
      isAuthenticated.set(true);
      await harness.navigateByUrl('/documents');
      expect(router.url).toBe('/documents');
    });

    it('sin sesión redirige a /login con returnUrl', async () => {
      await harness.navigateByUrl('/documents');
      expect(router.url).toBe('/login?returnUrl=%2Fdocuments');
    });

    // R7 (docs/auditoria-consistencia.md): returnUrl se concatena sin codificar y se pierden los
    // query params de la URL original a partir del primer `&`. Se corrige en la Fase 6 (tarea 6.3).
    it.fails('R7: conserva la URL original completa en returnUrl', async () => {
      await harness.navigateByUrl('/documents?q=acta&page=2');
      const returnUrl = router.parseUrl(router.url).queryParamMap.get('returnUrl');
      expect(returnUrl).toBe('/documents?q=acta&page=2');
    });
  });

  describe('guestGuard', () => {
    it('deja entrar al login sin sesión', async () => {
      await harness.navigateByUrl('/login');
      expect(router.url).toBe('/login');
    });

    it('con sesión redirige al dashboard', async () => {
      isAuthenticated.set(true);
      await harness.navigateByUrl('/login');
      expect(router.url).toBe('/dashboard');
    });
  });

  describe('roleGuard', () => {
    it('deja pasar a un rol permitido', async () => {
      currentUser.set(user('ADMIN'));
      await harness.navigateByUrl('/users');
      expect(router.url).toBe('/users');
      expect(notifications.error).not.toHaveBeenCalled();
    });

    it('a un rol no permitido lo avisa y lo redirige al dashboard', async () => {
      currentUser.set(user('EDITOR'));
      await harness.navigateByUrl('/users');
      expect(router.url).toBe('/dashboard');
      expect(notifications.error).toHaveBeenCalledWith('Acceso denegado', expect.any(String));
    });

    it('sin usuario también deniega', async () => {
      await harness.navigateByUrl('/users');
      expect(router.url).toBe('/dashboard');
    });
  });
});
