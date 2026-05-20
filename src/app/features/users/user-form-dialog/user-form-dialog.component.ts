import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Role, ROLE_LABELS } from '../../../core/models/role.model';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserFormDialogData,
  UserFormDialogResult,
} from '../../../core/models/user-form.models';
import { passwordMatchValidator } from './validators/password-match.validator';
import { passwordComplexityValidator } from './validators/password-complexity.validator';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatIconModule, MatTooltipModule, AlertComponent, ButtonComponent],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
})
export class UserFormDialogComponent implements OnInit {
  protected readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<UserFormDialogComponent, UserFormDialogResult>>(MatDialogRef);
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmPassword = signal(true);

  protected readonly isEdit = computed(() => this.data.mode === 'edit');
  protected readonly title = computed(() =>
    this.isEdit() ? 'Editar usuario' : 'Nuevo usuario',
  );
  protected readonly primaryLabel = computed(() =>
    this.isEdit() ? 'Guardar cambios' : 'Crear usuario',
  );
  protected readonly loadingLabel = computed(() =>
    this.isEdit() ? 'Actualizando...' : 'Guardando...',
  );
  protected readonly isSelfEdit = computed(
    () => this.isEdit() && this.data.user?.id === this.auth.currentUser()?.id,
  );

  protected readonly roleOptions = Object.entries(ROLE_LABELS) as [Role, string][];

  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      role: ['', [Validators.required]],
      password: [
        '',
        this.isEdit()
          ? [passwordComplexityValidator()]
          : [Validators.required, passwordComplexityValidator()],
      ],
      confirmPassword: [
        '',
        this.isEdit()
          ? [passwordComplexityValidator()]
          : [Validators.required, passwordComplexityValidator()],
      ],
    },
    { validators: passwordMatchValidator() },
  );

  ngOnInit(): void {
    if (this.isEdit() && this.data.user) {
      const { fullName, email, role } = this.data.user;
      this.form.patchValue({ fullName, email, role });
    }
    if (this.isSelfEdit()) {
      this.form.controls.role.disable();
    }
  }

  protected fullNameError(): string | null {
    const ctrl = this.form.controls.fullName;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'Ingrese el nombre completo';
    if (ctrl.hasError('minlength')) return 'El nombre debe tener al menos 3 caracteres';
    if (ctrl.hasError('maxlength')) return 'El nombre no puede superar los 100 caracteres';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected emailError(): string | null {
    const ctrl = this.form.controls.email;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'Ingrese el correo electrónico';
    if (ctrl.hasError('email')) return 'Ingrese un correo electrónico válido';
    if (ctrl.hasError('maxlength')) return 'El correo no puede superar los 150 caracteres';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected roleError(): string | null {
    const ctrl = this.form.controls.role;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'Seleccione un rol';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected passwordError(): string | null {
    const ctrl = this.form.controls.password;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'Ingrese una contraseña';
    if (ctrl.hasError('minLength')) return 'Debe tener al menos 12 caracteres';
    if (ctrl.hasError('maxLength')) return 'No puede superar los 128 caracteres';
    if (ctrl.hasError('noLowercase')) return 'Debe incluir al menos una letra minúscula';
    if (ctrl.hasError('noUppercase')) return 'Debe incluir al menos una letra mayúscula';
    if (ctrl.hasError('noDigit')) return 'Debe incluir al menos un número';
    if (ctrl.hasError('noSymbol')) return 'Debe incluir al menos un símbolo (ej: !, @, #, $)';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    return null;
  }

  protected confirmPasswordError(): string | null {
    const ctrl = this.form.controls.confirmPassword;
    if (!ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'Confirme su contraseña';
    if (ctrl.hasError('minLength')) return 'Debe tener al menos 12 caracteres';
    if (ctrl.hasError('maxLength')) return 'No puede superar los 128 caracteres';
    if (ctrl.hasError('noLowercase')) return 'Debe incluir al menos una letra minúscula';
    if (ctrl.hasError('noUppercase')) return 'Debe incluir al menos una letra mayúscula';
    if (ctrl.hasError('noDigit')) return 'Debe incluir al menos un número';
    if (ctrl.hasError('noSymbol')) return 'Debe incluir al menos un símbolo (ej: !, @, #, $)';
    if (ctrl.hasError('backend')) return ctrl.getError('backend') as string;
    if (this.form.hasError('passwordMismatch')) return 'Las contraseñas no coinciden';
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.submitError.set(null);
    this.form.disable();
    this.dialogRef.disableClose = true;

    if (this.isEdit() && this.data.user) {
      const raw = this.form.getRawValue();
      const req: UpdateUserRequest = {
        fullName: raw.fullName,
        email: raw.email,
        role: raw.role as Role,
      };
      if (raw.password) {
        req.password = raw.password;
        req.confirmPassword = raw.confirmPassword;
      }

      this.usersService
        .update(this.data.user.id, req)
        .pipe(
          finalize(() => {
            this.loading.set(false);
            this.form.enable();
            this.dialogRef.disableClose = false;
            if (this.isSelfEdit()) this.form.controls.role.disable();
          }),
        )
        .subscribe({
          next: (res) => {
            this.notifications.success(
              'Usuario actualizado',
              'Los cambios se guardaron correctamente.',
            );
            this.dialogRef.close({ kind: 'updated', user: res });
          },
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
    } else {
      const raw = this.form.getRawValue();
      const req: CreateUserRequest = {
        fullName: raw.fullName,
        email: raw.email,
        password: raw.password,
        confirmPassword: raw.confirmPassword,
        role: raw.role as Role,
      };

      this.usersService
        .create(req)
        .pipe(
          finalize(() => {
            this.loading.set(false);
            this.form.enable();
            this.dialogRef.disableClose = false;
          }),
        )
        .subscribe({
          next: (res) => {
            this.notifications.success(
              'Usuario creado',
              'Ya puede iniciar sesión con sus credenciales.',
            );
            this.dialogRef.close({ kind: 'created', user: res });
          },
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
    }
  }

  protected cancel(): void {
    this.dialogRef.close({ kind: 'cancelled' });
  }

  private handleError(err: HttpErrorResponse): void {
    switch (err.status) {
      case 400:
        if (err.error?.fieldErrors) {
          const fieldErrors = err.error.fieldErrors as Record<string, string>;
          Object.entries(fieldErrors).forEach(([field, msg]) => {
            const ctrl = this.form.get(field);
            if (ctrl) {
              ctrl.setErrors({ backend: msg });
              ctrl.markAsTouched();
            }
          });
        } else {
          this.submitError.set('Los datos enviados no son válidos. Revise el formulario');
        }
        break;
      case 409:
        this.submitError.set('Ya existe un usuario registrado con este correo electrónico');
        this.form.controls.email.setErrors({ backend: 'Este correo ya está registrado' });
        this.form.controls.email.markAsTouched();
        break;
      case 403:
        this.submitError.set('No tienes permisos para realizar esta acción');
        break;
      default:
        this.submitError.set('Ocurrió un error inesperado. Por favor, inténtalo de nuevo');
    }
  }
}
