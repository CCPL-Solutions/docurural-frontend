import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthState, LoginRequest, LoginResponse, LogoutResponse } from '../models/auth.models';
import { AuthStorageService } from './auth-storage.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(AuthStorageService);
  private readonly notifications = inject(NotificationService);

  private readonly _state = signal<AuthState>({ token: null, user: null, expiresAt: null });

  readonly currentUser = computed(() => this._state().user);
  readonly token = computed(() => this._state().token);
  readonly isAuthenticated = computed(() => {
    const s = this._state();
    return !!s.token && !!s.expiresAt && s.expiresAt > Date.now();
  });

  hydrate(): void {
    const saved = this.storage.read();
    if (!saved) return;
    if (saved.expiresAt !== null && saved.expiresAt < Date.now()) {
      this._clearLocal();
      return;
    }
    this._state.set(saved);
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
    if (reason === 'expired') {
      this.notifications.error(
        'Sesión expirada',
        'Por inactividad. Por favor, inicie sesión nuevamente.',
      );
    }
    const returnUrl = this.router.url;
    this._clearLocal();
    this.router.navigateByUrl(`/login?returnUrl=${returnUrl}`);
  }

  getReturnUrl(): string {
    const params = new URLSearchParams(window.location.search);
    return params.get('returnUrl') ?? '/dashboard';
  }

  private _setSession(res: LoginResponse): void {
    const state: AuthState = {
      token: res.token,
      user: res.user,
      expiresAt: Date.now() + res.expiresIn * 1000,
    };
    this.storage.write(state);
    this._state.set(state);
  }

  private _clearLocal(): void {
    this.storage.clear();
    this._state.set({ token: null, user: null, expiresAt: null });
  }
}
