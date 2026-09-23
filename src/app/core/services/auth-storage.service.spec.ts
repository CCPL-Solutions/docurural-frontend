import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthState } from '../models/auth.model';
import { AuthStorageService } from './auth-storage.service';

describe('AuthStorageService', () => {
  const state: AuthState = {
    token: 'jwt',
    user: { id: 1, fullName: 'Ana Pérez', email: 'ana@ierd.edu.co', role: 'ADMIN' },
    expiresAt: 1_900_000_000_000,
  };
  let storage: AuthStorageService;

  beforeEach(() => {
    localStorage.clear();
    storage = TestBed.inject(AuthStorageService);
  });

  it('retorna null si no hay sesión guardada', () => {
    expect(storage.read()).toBeNull();
  });

  it('guarda y lee la sesión bajo la clave del entorno', () => {
    storage.write(state);
    expect(localStorage.getItem(environment.tokenStorageKey)).not.toBeNull();
    expect(storage.read()).toEqual(state);
  });

  it('retorna null si lo guardado no es JSON válido', () => {
    localStorage.setItem(environment.tokenStorageKey, '{roto');
    expect(storage.read()).toBeNull();
  });

  it('clear elimina la sesión', () => {
    storage.write(state);
    storage.clear();
    expect(storage.read()).toBeNull();
  });
});
