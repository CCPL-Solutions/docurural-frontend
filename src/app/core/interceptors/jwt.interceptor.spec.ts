import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  const token = signal<string | null>('jwt');
  const forceLogout = vi.fn();
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    token.set('jwt');
    forceLogout.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token, forceLogout } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('añade la cabecera Authorization si hay token', () => {
    http.get('/api/documents').subscribe();
    const req = controller.expectOne('/api/documents');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt');
    req.flush([]);
  });

  it('no añade la cabecera si no hay token', () => {
    token.set(null);
    http.get('/api/documents').subscribe();
    const req = controller.expectOne('/api/documents');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('no toca la petición de login, ni siquiera ante un 401', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    const req = controller.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(forceLogout).not.toHaveBeenCalled();
  });

  it("un 401 fuerza el cierre de sesión 'expired' y propaga el error", () => {
    const error = vi.fn();
    http.get('/api/documents').subscribe({ error });
    controller.expectOne('/api/documents').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(forceLogout).toHaveBeenCalledWith('expired');
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("un 401 en el logout cierra sesión 'silent'", () => {
    http.post('/api/auth/logout', {}).subscribe({ error: () => {} });
    controller
      .expectOne('/api/auth/logout')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(forceLogout).toHaveBeenCalledWith('silent');
  });

  it('otros errores se propagan sin cerrar sesión', () => {
    const error = vi.fn();
    http.get('/api/documents').subscribe({ error });
    controller.expectOne('/api/documents').flush(null, { status: 500, statusText: 'Error' });
    expect(forceLogout).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }));
  });
});
