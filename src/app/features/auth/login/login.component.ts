import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { applyFieldErrors } from '@shared/forms/apply-field-errors';
import { FieldErrorComponent } from '@shared/forms/field-error.component';
import { LOGIN_MESSAGES } from './login.messages';
import { safeReturnUrl } from './return-url';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    AlertComponent,
    ButtonComponent,
    FieldErrorComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitErrorVariant = signal<'error' | 'warning'>('error');
  protected readonly accountInactive = signal(false);
  protected readonly hidePassword = signal(true);

  protected readonly messages = LOGIN_MESSAGES;

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.submitError.set(null);
    this.accountInactive.set(false);
    this.form.disable();

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () =>
          this.router.navigateByUrl(
            safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
          ),
        error: (err: HttpErrorResponse) => {
          // Antes de aplicar errores: enable() vuelve a validar y borraría los del backend (R12).
          this.form.enable();
          // En el login, un 401 son credenciales incorrectas, no una sesión caducada: el
          // interceptor no gestiona /auth/login.
          if (err.status === HttpStatusCode.Unauthorized) {
            this.submitError.set('Correo o contraseña incorrectos');
            this.submitErrorVariant.set('error');
          } else if (err.status === HttpStatusCode.Forbidden) {
            this.submitError.set('Su cuenta ha sido desactivada. Contacte al administrador');
            this.submitErrorVariant.set('warning');
            this.accountInactive.set(true);
          } else if (!applyFieldErrors(this.form, err)) {
            this.submitError.set(
              'No fue posible conectar con el servidor. Intente nuevamente en unos minutos',
            );
            this.submitErrorVariant.set('error');
          }
        },
      });
  }
}
