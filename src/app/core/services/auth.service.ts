import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { environment } from '@env/environment';
import { AuthState, LoginRequest, LoginResponse, LogoutResponse } from '../models/auth.model';
import { AuthStorageService } from './auth-storage.service';
import { NotificationService } from './notification.service';

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(AuthStorageService);
  private readonly notifications = inject(NotificationService);

  private readonly _state = signal<AuthState>({ token: null, user: null, expiresAt: null });
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;

  readonly currentUser = computed(() => this._state().user);
  readonly token = computed(() => this._state().token);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.expiryTimer));
  }

  /**
   * Método y no `computed`: un `computed` memoiza `Date.now()` y seguiría en `true` tras vencer
   * el token (R4). Al leer `_state` sigue siendo reactivo para quien lo llame desde una plantilla.
   */
  isAuthenticated(): boolean {
    const s = this._state();
    return !!s.token && !!s.expiresAt && s.expiresAt > Date.now();
  }

  hydrate(): void {
    const saved = this.storage.read();
    if (!saved) return;
    if (saved.expiresAt !== null && saved.expiresAt < Date.now()) {
      this._clearLocal();
      return;
    }
    this._state.set(saved);
    this.scheduleExpiry();
  }

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, req)
      .pipe(tap((res) => this._setSession(res)));
  }

  logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      catchError(() => EMPTY),
      finalize(() => {
        this._clearLocal();
        this.router.navigateByUrl('/login');
      }),
    );
  }

  forceLogout(reason: 'expired' | 'silent'): void {
    // Si el temporizador ya cerró la sesión, los 401 de las peticiones en curso no repiten el aviso.
    if (this._state().token === null) return;
    if (reason === 'expired') {
      this.notifications.error(
        'Sesión expirada',
        'Por inactividad. Por favor, inicie sesión nuevamente.',
      );
    }
    const returnUrl = this.router.url;
    this._clearLocal();
    this.router.navigate(
      ['/login'],
      returnUrl.startsWith('/login') ? {} : { queryParams: { returnUrl } },
    );
  }

  private _setSession(res: LoginResponse): void {
    const state: AuthState = {
      token: res.token,
      user: res.user,
      expiresAt: Date.now() + res.expiresIn * 1000,
    };
    this.storage.write(state);
    this._state.set(state);
    this.scheduleExpiry();
  }

  /**
   * Cierra la sesión al llegar `expiresAt`, sin esperar a que el backend responda 401. Si el
   * temporizador salta antes de tiempo (el retraso máximo de `setTimeout` es de unos 24 días), se
   * vuelve a programar.
   */
  private scheduleExpiry(): void {
    clearTimeout(this.expiryTimer);
    const expiresAt = this._state().expiresAt;
    if (expiresAt === null) return;
    const delay = Math.min(expiresAt - Date.now(), MAX_TIMEOUT_MS);
    this.expiryTimer = setTimeout(() => {
      if (this.isAuthenticated()) this.scheduleExpiry();
      else this.forceLogout('expired');
    }, delay);
  }

  private _clearLocal(): void {
    clearTimeout(this.expiryTimer);
    this.storage.clear();
    this._state.set({ token: null, user: null, expiresAt: null });
  }
}
