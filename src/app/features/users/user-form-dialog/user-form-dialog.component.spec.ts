import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { Role } from '@core/models/role.model';
import { CreateUserRequest, UpdateUserRequest } from '@core/models/user-form.model';
import { User } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { UsersService } from '@core/services/users.service';
import { UserFormDialogComponent, UserFormDialogData } from './user-form-dialog.component';

const CURRENT_ADMIN_ID = 1;
const VALID_PASSWORD = 'Institucion#2026';

const user = (overrides: Partial<User> = {}): User => ({
  id: 7,
  fullName: 'Ana Gómez Torres',
  email: 'coordinadora@minayticha.edu.co',
  role: 'EDITOR',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  lastLogin: null,
  canApprove: false,
  ...overrides,
});

describe('UserFormDialogComponent', () => {
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let success: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    create = vi.fn((req: CreateUserRequest) => of({ ...user(), ...req, id: 9, message: 'ok' }));
    update = vi.fn((id: number, req: UpdateUserRequest) =>
      of({ ...user({ id }), ...req, canApprove: req.canApprove ?? true, message: 'ok' }),
    );
    success = vi.fn();
    close = vi.fn();
  });

  async function render(data: UserFormDialogData) {
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close, disableClose: false } },
        { provide: UsersService, useValue: { create, update } },
        { provide: NotificationService, useValue: { success } },
        {
          provide: AuthService,
          useValue: { currentUser: signal({ id: CURRENT_ADMIN_ID, role: 'ADMIN' }) },
        },
      ],
    });
    const fixture = TestBed.createComponent(UserFormDialogComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const component = fixture.componentInstance;
    const form = component['form'];

    const checkbox = () => host.querySelector<HTMLInputElement>('#canApprove')!;
    const hint = () => host.querySelector('#canApprove-hint')?.textContent?.trim() ?? '';
    const warning = () => host.querySelector('.approval__warning');
    const chooseRole = async (role: Role) => {
      form.controls.role.setValue(role);
      await fixture.whenStable();
    };
    const toggleCheckbox = async () => {
      checkbox().click();
      await fixture.whenStable();
    };
    const fillCreateFields = () =>
      form.patchValue({
        fullName: 'Jaime Ortiz Beltrán',
        email: 'sistemas@minayticha.edu.co',
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
      });
    const submit = async () => {
      component['onSubmit']();
      await fixture.whenStable();
    };

    return {
      fixture,
      host,
      form,
      checkbox,
      hint,
      warning,
      chooseRole,
      toggleCheckbox,
      fillCreateFields,
      submit,
    };
  }

  const createData: UserFormDialogData = { mode: 'create' };
  const editData = (overrides: Partial<User> = {}): UserFormDialogData => ({
    mode: 'edit',
    user: user(overrides),
  });

  it('muestra el bloque "Aprobación de documentos" con la casilla', async () => {
    const { host, checkbox } = await render(createData);

    expect(host.textContent).toContain('Aprobación de documentos');
    expect(host.textContent).toContain('Puede aprobar documentos');
    expect(checkbox().getAttribute('aria-describedby')).toBe('canApprove-hint');
  });

  describe('US1 · editar', () => {
    it('muestra marcada y habilitada la casilla de un EDITOR con el permiso', async () => {
      const { checkbox } = await render(editData({ canApprove: true }));

      expect(checkbox().checked).toBe(true);
      expect(checkbox().disabled).toBe(false);
    });

    it('guarda el valor de la casilla al editar', async () => {
      const { toggleCheckbox, submit } = await render(editData({ canApprove: true }));

      await toggleCheckbox();
      await submit();

      expect(update).toHaveBeenCalledWith(7, expect.objectContaining({ canApprove: false }));
    });

    it('explica el permiso según el rol elegido', async () => {
      const { hint, chooseRole } = await render(editData());

      expect(hint()).toBe('Podrá revisar y aprobar los documentos enviados a aprobación.');
      await chooseRole('ADMIN');
      expect(hint()).toBe(
        'El rol Administrador no incluye este permiso: márquelo solo si esta persona debe aprobar.',
      );
    });

    it('en la autoedición bloquea la casilla y no envía el permiso', async () => {
      const { checkbox, hint, submit } = await render(
        editData({ id: CURRENT_ADMIN_ID, role: 'ADMIN', canApprove: true }),
      );

      expect(checkbox().checked).toBe(true);
      expect(checkbox().disabled).toBe(true);
      expect(hint()).toBe('No puede cambiar su propio permiso de aprobación.');

      await submit();

      const req = update.mock.calls[0][1] as UpdateUserRequest;
      expect('canApprove' in req).toBe(false);
    });

    it('tras un error vuelve a habilitar la casilla, salvo en la autoedición', async () => {
      update = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 500 })));
      const other = await render(editData({ canApprove: true }));
      await other.submit();
      expect(other.checkbox().disabled).toBe(false);

      TestBed.resetTestingModule();
      const self = await render(editData({ id: CURRENT_ADMIN_ID, role: 'ADMIN' }));
      await self.submit();
      expect(self.checkbox().disabled).toBe(true);
    });
  });

  describe('US2 · crear', () => {
    it('la casilla aparece desmarcada al crear', async () => {
      const { checkbox } = await render(createData);

      expect(checkbox().checked).toBe(false);
    });

    it('envía el permiso marcado al crear un EDITOR', async () => {
      const { chooseRole, toggleCheckbox, fillCreateFields, submit } = await render(createData);

      fillCreateFields();
      await chooseRole('EDITOR');
      await toggleCheckbox();
      await submit();

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'EDITOR', canApprove: true }),
      );
    });

    it('sin tocar la casilla envía el permiso desmarcado', async () => {
      const { chooseRole, fillCreateFields, submit } = await render(createData);

      fillCreateFields();
      await chooseRole('ADMIN');
      await submit();

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'ADMIN', canApprove: false }),
      );
    });
  });

  describe('US3 · lectores', () => {
    it('con el rol Lector la casilla queda desmarcada y bloqueada, y se envía sin permiso', async () => {
      const { checkbox, hint, chooseRole, toggleCheckbox, fillCreateFields, submit } =
        await render(createData);

      fillCreateFields();
      await toggleCheckbox();
      await chooseRole('READER');

      expect(checkbox().checked).toBe(false);
      expect(checkbox().disabled).toBe(true);
      expect(hint()).toBe('Los lectores no pueden aprobar documentos.');

      await submit();
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'READER', canApprove: false }),
      );
    });

    it('avisa antes de guardar y recupera el valor al volver a Editor', async () => {
      const { checkbox, warning, chooseRole } = await render(editData({ canApprove: true }));

      await chooseRole('READER');
      expect(checkbox().checked).toBe(false);
      expect(checkbox().disabled).toBe(true);
      expect(warning()?.textContent).toContain('Se retirará el permiso de aprobación.');
      expect(warning()?.textContent).toContain(
        'Al cambiar el rol a Lector, Ana Gómez Torres dejará de poder aprobar documentos',
      );

      await chooseRole('EDITOR');
      expect(checkbox().checked).toBe(true);
      expect(checkbox().disabled).toBe(false);
      expect(warning()).toBeNull();
    });

    it('un lector que pasa a Editor tiene la casilla habilitada y desmarcada, sin aviso', async () => {
      const { checkbox, warning, chooseRole } = await render(editData({ role: 'READER' }));
      expect(checkbox().disabled).toBe(true);

      await chooseRole('EDITOR');

      expect(checkbox().checked).toBe(false);
      expect(checkbox().disabled).toBe(false);
      expect(warning()).toBeNull();
    });

    it('sin permiso previo no avisa al pasar a Lector', async () => {
      const { warning, chooseRole } = await render(editData());

      await chooseRole('READER');

      expect(warning()).toBeNull();
    });

    it('al guardar el cambio a Lector envía el permiso retirado y lo confirma en el toast', async () => {
      update = vi.fn((id: number, req: UpdateUserRequest) =>
        of({ ...user({ id }), ...req, canApprove: false, message: 'ok' }),
      );
      const { chooseRole, submit } = await render(editData({ canApprove: true }));

      await chooseRole('READER');
      await submit();

      expect(update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ role: 'READER', canApprove: false }),
      );
      expect(success).toHaveBeenCalledWith(
        'Usuario actualizado',
        'Se retiró el permiso para aprobar documentos.',
      );
    });

    it('en el resto de ediciones mantiene el toast habitual', async () => {
      const { submit } = await render(editData({ canApprove: true }));

      await submit();

      expect(success).toHaveBeenCalledWith(
        'Usuario actualizado',
        'Los cambios se guardaron correctamente.',
      );
    });

    it('un 400 sin errores de campo muestra el mensaje del servidor', async () => {
      update = vi.fn(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { message: 'Los lectores no pueden aprobar documentos' },
            }),
        ),
      );
      const { host, submit } = await render(editData({ canApprove: true }));

      await submit();

      expect(host.querySelector('app-alert')?.textContent).toContain(
        'Los lectores no pueden aprobar documentos',
      );
    });

    it('un 400 sin mensaje muestra el error genérico', async () => {
      update = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 400 })));
      const { host, submit } = await render(editData());

      await submit();

      expect(host.querySelector('app-alert')?.textContent).toContain(
        'Los datos enviados no son válidos. Revise el formulario.',
      );
    });
  });
});
