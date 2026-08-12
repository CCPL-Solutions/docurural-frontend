import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/role.model';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export function roleGuard(allowed: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notifications = inject(NotificationService);

    if (allowed.includes(auth.currentUser()?.role as Role)) return true;

    notifications.error('Acceso denegado', 'No tiene permisos para realizar esta acción.');
    return router.parseUrl('/dashboard');
  };
}
