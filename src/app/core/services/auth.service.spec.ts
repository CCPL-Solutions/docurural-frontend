import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '@env/environment';
import { AuthState, LoginResponse } from '../models/auth.model';
import { AuthService } from './auth.service';
import { AuthStorageService } from './auth-storage.service';
import { NotificationService } from './notification.service';

const API = environment.apiBaseUrl;
const NOW = new Date('2026-09-23T12:00:00Z').getTime();
const USER = { id: 1, fullName: 'Ana Pérez', email: 'ana@ierd.edu.co', role: 'ADMIN' as const };

describe('AuthService', () => {
  let auth: AuthService;
  let storage: AuthStorageService;
  let http: HttpTestingController;
  let router: Router;
  let notifications: { error: ReturnType<typeof vi.fn> };

  function setup(saved: AuthState | null = null): void {
    notifications = { error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NotificationService, useValue: notifications },
      ],
    });
    storage = TestBed.inject(AuthStorageService);
    if (saved) storage.write(saved);
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  describe('hydrate', () => {
    it('sin sesión guardada queda sin autenticar', () => {
      setup();
      auth.hydrate();
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.currentUser()).toBeNull();
    });

    it('restaura una sesión vigente', () => {
      setup({ token: 'jwt', user: USER, expiresAt: NOW + 60_000 });
      auth.hydrate();
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.token()).toBe('jwt');
      expect(auth.currentUser()).toEqual(USER);
    });

    it('descarta y borra una sesión vencida', () => {
      setup({ token: 'jwt', user: USER, expiresAt: NOW - 1 });
      auth.hydrate();
      expect(auth.isAuthenticated()).toBe(false);
      expect(storage.read()).toBeNull();
    });
  });

  describe('login', () => {
    it('envía las credenciales y guarda la sesión con su vencimiento', () => {
      setup();
      const response: LoginResponse = {
        token: 'jwt',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: USER,
      };

      auth.login({ email: USER.email, password: 'x' }).subscribe();
      const req = http.expectOne(`${API}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: USER.email, password: 'x' });
      req.flush(response);

      expect(auth.isAuthenticated()).toBe(true);
      expect(storage.read()).toEqual({ token: 'jwt', user: USER, expiresAt: NOW + 3_600_000 });
    });
  });

  describe('logout', () => {
    it('limpia la sesión y navega a /login cuando el backend responde', () => {
      setup({ token: 'jwt', user: USER, expiresAt: NOW + 60_000 });
      auth.hydrate();

      auth.logout().subscribe();
      http.expectOne(`${API}/auth/logout`).flush({ message: 'ok' });

      expect(auth.isAuthenticated()).toBe(false);
      expect(storage.read()).toBeNull();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    });

    it('limpia la sesión aunque el backend falle, sin propagar el error', () => {
      setup({ token: 'jwt', user: USER, expiresAt: NOW + 60_000 });
      auth.hydrate();
      const error = vi.fn();

      auth.logout().subscribe({ error });
      http.expectOne(`${API}/auth/logout`).flush(null, { status: 500, statusText: 'Error' });

      expect(error).not.toHaveBeenCalled();
      expect(auth.isAuthenticated()).toBe(false);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    });
  });

  describe('forceLogout', () => {
    it("'expired' avisa al usuario, limpia y redirige con returnUrl", () => {
      setup({ token: 'jwt', user: USER, expiresAt: NOW + 60_000 });
      auth.hydrate();

      auth.forceLogout('expired');

      expect(notifications.error).toHaveBeenCalledWith('Sesión expirada', expect.any(String));
      expect(auth.isAuthenticated()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
    });

    it('sin sesión no repite el aviso (varios 401 a la vez o tras el temporizador)', () => {
      setup();

      auth.forceLogout('expired');

      expect(notifications.error).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it("'silent' no avisa", () => {
      setup({ token: 'jwt', user: USER, expiresAt: NOW + 60_000 });
      auth.hydrate();

      auth.forceLogout('silent');

      expect(notifications.error).not.toHaveBeenCalled();
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  // R4 (docs/auditoria-consistencia.md), corregido en la Fase 6 (tarea 6.2).
  it('R4: deja de estar autenticado cuando vence el token', () => {
    setup({ token: 'jwt', user: USER, expiresAt: NOW + 60_000 });
    auth.hydrate();
    expect(auth.isAuthenticated()).toBe(true);

    vi.setSystemTime(NOW + 60_001);

    expect(auth.isAuthenticated()).toBe(false);
  });

  it('R4: al llegar expiresAt cierra la sesión y avisa, sin esperar un 401', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(NOW);
    setup({ token: 'jwt', user: USER, expiresAt: NOW + 60_000 });
    auth.hydrate();

    vi.advanceTimersByTime(59_999);
    expect(notifications.error).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(notifications.error).toHaveBeenCalledWith('Sesión expirada', expect.any(String));
    expect(auth.isAuthenticated()).toBe(false);
    expect(storage.read()).toBeNull();
  });

  it('el logout cancela el cierre programado', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(NOW);
    setup({ token: 'jwt', user: USER, expiresAt: NOW + 60_000 });
    auth.hydrate();

    auth.logout().subscribe();
    http.expectOne(`${API}/auth/logout`).flush({ message: 'ok' });
    vi.advanceTimersByTime(60_000);

    expect(notifications.error).not.toHaveBeenCalled();
  });
});
