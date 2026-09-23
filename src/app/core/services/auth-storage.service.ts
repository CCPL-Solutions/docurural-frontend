import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthState } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly key = environment.tokenStorageKey;

  read(): AuthState | null {
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthState;
    } catch {
      return null;
    }
  }

  write(state: AuthState): void {
    localStorage.setItem(this.key, JSON.stringify(state));
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}
