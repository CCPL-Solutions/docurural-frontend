import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AuthService } from '@core/services/auth.service';
import { UsersService } from '@core/services/users.service';
import { NotificationService } from '@core/services/notification.service';
import { canHoldApprovalPermission, isAdmin, isEditor } from '@core/auth/permissions';
import { Role, ROLE_LABELS } from '@core/models/role.model';
import { User } from '@core/models/user.model';
import {
  CreateUserRequest,
  MAX_EMAIL_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MIN_FULL_NAME_LENGTH,
  UpdateUserRequest,
  UpdateUserResponse,
} from '@core/models/user-form.model';
import { applyFieldErrors } from '@shared/forms/apply-field-errors';
import { toApiError } from '@shared/http/api-error';
import { trimmedMinLength } from '@shared/forms/validators';
import { passwordMatchValidator } from './validators/password-match.validator';
import { passwordComplexityValidator } from './validators/password-complexity.validator';
import { FieldErrorComponent } from '@shared/forms/field-error.component';
import { USER_FORM_MESSAGES } from './user-form.messages';

export type UserFormMode = 'create' | 'edit';

export interface UserFormDialogData {
  mode: UserFormMode;
  user?: User;
}

export type UserFormDialogResult =
  | { kind: 'created'; user: User }
  | { kind: 'updated'; user: Omit<UpdateUserResponse, 'message'> }
  | { kind: 'cancelled' };

/** Valor del control de rol como `Role`; `null` mientras no se ha elegido ninguno. */
function toRole(value: string): Role | null {
  return value === '' ? null : (value as Role);
}

/** El rol elegido no admite el permiso de aprobar (hoy, solo READER). Sin rol no bloquea. */
function blocksApproval(role: Role | null): boolean {
  return role !== null && !canHoldApprovalPermission(role);
}

@Component({
  selector: 'app-user-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FieldErrorComponent,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    AlertComponent,
    ButtonComponent,
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
})
export class UserFormDialogComponent implements OnInit {
  protected readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<UserFormDialogComponent, UserFormDialogResult>>(MatDialogRef);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersService = inject(UsersService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmPassword = signal(true);

  protected readonly isEdit = computed(() => this.data.mode === 'edit');
  protected readonly title = computed(() =>
    this.isEdit()
      ? $localize`:@@users.form.titleEdit:Editar usuario`
      : $localize`:@@users.form.titleCreate:Nuevo usuario`,
  );
  protected readonly primaryLabel = computed(() =>
    this.isEdit()
      ? $localize`:@@common.saveChanges:Guardar cambios`
      : $localize`:@@users.form.submitCreate:Crear usuario`,
  );
  protected readonly loadingLabel = computed(() =>
    this.isEdit()
      ? $localize`:@@common.updating:Actualizando…`
      : $localize`:@@common.saving:Guardando…`,
  );
  protected readonly isSelfEdit = computed(
    () => this.isEdit() && this.data.user?.id === this.auth.currentUser()?.id,
  );

  protected readonly messages = USER_FORM_MESSAGES;
  protected readonly labels = {
    showPassword: $localize`:@@login.password.show:Mostrar contraseña`,
    hidePassword: $localize`:@@login.password.hide:Ocultar contraseña`,
    showConfirmation: $localize`:@@users.form.confirmPassword.show:Mostrar confirmación`,
    hideConfirmation: $localize`:@@users.form.confirmPassword.hide:Ocultar confirmación`,
  };
  protected readonly roleOptions = Object.entries(ROLE_LABELS) as [Role, string][];

  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: [
        '',
        [
          Validators.required,
          trimmedMinLength(MIN_FULL_NAME_LENGTH),
          Validators.maxLength(MAX_FULL_NAME_LENGTH),
        ],
      ],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(MAX_EMAIL_LENGTH)]],
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
      canApprove: [false],
    },
    { validators: passwordMatchValidator() },
  );

  private readonly roleValue = toSignal(this.form.controls.role.valueChanges, {
    initialValue: this.form.controls.role.value,
  });
  /** Rol elegido en el formulario; `null` mientras no se elige. */
  protected readonly selectedRole = computed(() => toRole(this.roleValue()));

  /** Valor de la casilla antes de pasar a un rol que no admite el permiso; se restaura al salir. */
  private rememberedCanApprove = false;

  protected readonly approvalHint = computed(() => {
    if (this.isSelfEdit()) {
      return $localize`:@@users.form.approval.hintSelf:No puede cambiar su propio permiso de aprobación.`;
    }
    const role = this.selectedRole();
    if (isAdmin(role)) {
      return $localize`:@@users.form.approval.hintAdmin:El rol Administrador no incluye este permiso: márquelo solo si esta persona debe aprobar.`;
    }
    if (isEditor(role)) {
      return $localize`:@@users.form.approval.hintEditor:Podrá revisar y aprobar los documentos enviados a aprobación.`;
    }
    if (blocksApproval(role)) {
      return $localize`:@@users.form.approval.hintReader:Los lectores no pueden aprobar documentos.`;
    }
    return '';
  });

  /** La casilla está bloqueada por una regla (autoedición o rol), no solo mientras se guarda. */
  protected readonly approvalLocked = computed(
    () => this.isSelfEdit() || blocksApproval(this.selectedRole()),
  );

  /** Aviso antes de guardar: el usuario tenía el permiso y el rol elegido lo retira (FR-005). */
  protected readonly showRevokeWarning = computed(
    () =>
      this.isEdit() &&
      !this.isSelfEdit() &&
      this.data.user?.canApprove === true &&
      blocksApproval(this.selectedRole()),
  );

  ngOnInit(): void {
    if (this.isEdit() && this.data.user) {
      const { fullName, email, role, canApprove } = this.data.user;
      this.form.patchValue({ fullName, email, role, canApprove });
    }
    if (this.isSelfEdit()) {
      this.form.controls.role.disable();
    }
    this.syncApproverControl();
    // Tras el relleno inicial, para que el patchValue no dispare la restauración.
    this.watchRoleForApproval();
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
      const role = raw.role as Role;
      const req: UpdateUserRequest = {
        fullName: raw.fullName,
        email: raw.email,
        role,
      };
      if (raw.password) {
        req.password = raw.password;
        req.confirmPassword = raw.confirmPassword;
      }
      // En la autoedición se omite: el backend conserva el valor y nadie cambia su propio permiso.
      if (!this.isSelfEdit()) {
        req.canApprove = this.approvalToSend(role, raw.canApprove);
      }
      const wasApprover = this.data.user.canApprove;

      this.usersService
        .update(this.data.user.id, req)
        .pipe(
          finalize(() => this.loading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (res) => {
            const approvalRevoked =
              wasApprover && !res.canApprove && !canHoldApprovalPermission(role);
            this.notifications.success(
              $localize`:@@users.toast.updated.title:Usuario actualizado`,
              approvalRevoked
                ? $localize`:@@users.toast.updated.approvalRevoked:Se retiró el permiso para aprobar documentos.`
                : $localize`:@@users.toast.updated.description:Los cambios se guardaron correctamente.`,
            );
            this.dialogRef.close({ kind: 'updated', user: res });
          },
          error: (err: HttpErrorResponse) => this.handleError(err),
        });
    } else {
      const raw = this.form.getRawValue();
      const role = raw.role as Role;
      const req: CreateUserRequest = {
        fullName: raw.fullName,
        email: raw.email,
        password: raw.password,
        confirmPassword: raw.confirmPassword,
        role,
        canApprove: this.approvalToSend(role, raw.canApprove),
      };

      this.usersService
        .create(req)
        .pipe(
          finalize(() => this.loading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (res) => {
            this.notifications.success(
              $localize`:@@users.toast.created.title:Usuario creado`,
              $localize`:@@users.toast.created.description:Ya puede iniciar sesión con sus credenciales.`,
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

  /** Deja el formulario editable tras un error. */
  private unlockForm(): void {
    this.form.enable();
    if (this.isSelfEdit()) this.form.controls.role.disable();
    this.syncApproverControl();
    this.dialogRef.disableClose = false;
  }

  /** Nunca se envía el permiso concedido a un rol que no lo admite (FR-009). */
  private approvalToSend(role: Role, checked: boolean): boolean {
    return canHoldApprovalPermission(role) && checked;
  }

  /** Única decisión sobre si la casilla está habilitada: autoedición o rol que no la admite. */
  private syncApproverControl(): void {
    const control = this.form.controls.canApprove;
    const locked = this.isSelfEdit() || blocksApproval(toRole(this.form.controls.role.value));
    if (locked) {
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
    }
  }

  /**
   * Al pasar a un rol que no admite el permiso, desmarca la casilla y recuerda su valor; al volver a
   * uno que sí, lo restaura (FR-006). Puente con el FormControl: no escribe en signals (EST-05).
   */
  private watchRoleForApproval(): void {
    const approval = this.form.controls.canApprove;
    this.rememberedCanApprove = approval.value;
    let wasBlocked = blocksApproval(toRole(this.form.controls.role.value));

    this.form.controls.role.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const blocked = blocksApproval(toRole(value));
        if (blocked && !wasBlocked) {
          this.rememberedCanApprove = approval.value;
          approval.setValue(false);
        } else if (!blocked && wasBlocked) {
          approval.setValue(this.rememberedCanApprove);
        }
        wasBlocked = blocked;
        this.syncApproverControl();
      });
  }

  private handleError(err: HttpErrorResponse): void {
    // Antes de aplicar errores: enable() vuelve a validar y borraría los del backend (R12).
    this.unlockForm();
    switch (err.status) {
      case HttpStatusCode.BadRequest:
        // Sin errores de campo, el mensaje del backend explica el rechazo (p. ej., lector con permiso).
        if (!applyFieldErrors(this.form, err)) {
          this.submitError.set(
            toApiError(err)?.message ??
              $localize`:@@common.error.invalidData:Los datos enviados no son válidos. Revise el formulario.`,
          );
        }
        break;
      case HttpStatusCode.Conflict:
        this.submitError.set(
          $localize`:@@users.form.error.emailConflict:Ya existe un usuario registrado con este correo electrónico.`,
        );
        this.form.controls.email.setErrors({
          backend: $localize`:@@users.form.error.emailTaken:Este correo ya está registrado.`,
        });
        this.form.controls.email.markAsTouched();
        break;
      case HttpStatusCode.Forbidden:
        this.submitError.set(
          $localize`:@@common.error.forbidden:No tiene permisos para realizar esta acción.`,
        );
        break;
      default:
        this.submitError.set(
          $localize`:@@common.error.unexpected:Ocurrió un error inesperado. Por favor, inténtelo de nuevo.`,
        );
    }
  }
}
