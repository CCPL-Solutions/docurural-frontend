import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, AlertComponent, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
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

  protected emailError(): string | null {
    const ctrl = this.form.controls.email;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'Ingrese su correo electrónico';
    if (ctrl.hasError('email')) return 'Ingrese un correo electrónico válido';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected passwordError(): string | null {
    const ctrl = this.form.controls.password;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'Ingrese su contraseña';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

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
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: () => this.router.navigateByUrl(this.authService.getReturnUrl()),
        error: (err: HttpErrorResponse) => {
          if (err.status === 401) {
            this.submitError.set('Correo o contraseña incorrectos');
            this.submitErrorVariant.set('error');
          } else if (err.status === 403) {
            this.submitError.set('Su cuenta ha sido desactivada. Contacte al administrador');
            this.submitErrorVariant.set('warning');
            this.accountInactive.set(true);
          } else if (err.status === 400 && err.error?.fieldErrors) {
            const fieldErrors = err.error.fieldErrors as Record<string, string>;
            Object.entries(fieldErrors).forEach(([campo, msg]) => {
              this.form.get(campo)?.setErrors({ backend: msg });
            });
          } else {
            this.submitError.set(
              'No fue posible conectar con el servidor. Intente nuevamente en unos minutos',
            );
            this.submitErrorVariant.set('error');
          }
        },
      });
  }
}
