import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NEVER, Observable, of, throwError } from 'rxjs';
import { Category } from '@core/models/category.model';
import { UpdateCategoryRequest } from '@core/models/category-list.model';
import { User } from '@core/models/user.model';
import { UserListResponse } from '@core/models/user-list.model';
import { CategoriesService } from '@core/services/categories.service';
import { NotificationService } from '@core/services/notification.service';
import { UsersService } from '@core/services/users.service';
import {
  CategoryFormDialogComponent,
  CategoryFormDialogData,
} from './category-form-dialog.component';

const category = (overrides: Partial<Category> = {}): Category => ({
  id: 4,
  name: 'Informes',
  description: 'Informes de gestión',
  status: 'ACTIVE',
  documentCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'Ana Pérez',
  defaultSensitivityLevel: 'INTERNAL',
  requiresApproval: false,
  ...overrides,
});

const approver = (id: number, overrides: Partial<User> = {}): User => ({
  id,
  fullName: `Usuario ${id}`,
  email: `u${id}@minayticha.edu.co`,
  role: 'EDITOR',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  lastLogin: null,
  canApprove: true,
  ...overrides,
});

const usersPage = (...users: User[]): UserListResponse => ({ totalUsers: users.length, users });

describe('CategoryFormDialogComponent', () => {
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let list: ReturnType<typeof vi.fn>;
  let success: ReturnType<typeof vi.fn>;
  let info: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    create = vi.fn((req: UpdateCategoryRequest) =>
      of({ ...category({ id: 9 }), ...req, message: 'ok' }),
    );
    update = vi.fn((id: number, req: UpdateCategoryRequest) =>
      of({ ...category({ id }), ...req, message: 'ok' }),
    );
    list = vi.fn((): Observable<UserListResponse> => of(usersPage()));
    success = vi.fn();
    info = vi.fn();
    close = vi.fn();
  });

  async function render(data: CategoryFormDialogData) {
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close, disableClose: false } },
        { provide: CategoriesService, useValue: { create, update } },
        { provide: UsersService, useValue: { list } },
        { provide: NotificationService, useValue: { success, info } },
      ],
    });
    const fixture = TestBed.createComponent(CategoryFormDialogComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const component = fixture.componentInstance;
    const form = component['form'];

    const toggle = () => host.querySelector<HTMLButtonElement>('[role="switch"]')!;
    const state = () => host.querySelector('.approval-field__state')?.textContent?.trim() ?? '';
    const warning = () => host.querySelector('.approval-field__warning');
    const setApproval = async (value: boolean) => {
      form.controls.requiresApproval.setValue(value);
      await fixture.whenStable();
    };
    const clickToggle = async () => {
      toggle().click();
      await fixture.whenStable();
    };
    const submit = async () => {
      component['onSubmit']();
      await fixture.whenStable();
    };

    return { fixture, host, form, toggle, state, warning, setApproval, clickToggle, submit };
  }

  const createData: CategoryFormDialogData = { mode: 'create' };
  const editData = (overrides: Partial<Category> = {}): CategoryFormDialogData => ({
    mode: 'edit',
    category: category(overrides),
  });

  describe('campo "Requiere aprobación"', () => {
    it('tiene el control y muestra el interruptor con su etiqueta y su ayuda', async () => {
      const { host, form, toggle } = await render(createData);

      expect(form.controls.requiresApproval).toBeDefined();
      expect(toggle()).not.toBeNull();
      expect(host.querySelector('#requiresApproval-label')?.textContent).toContain(
        'Requiere aprobación',
      );
      expect(host.querySelector('#requiresApproval-hint')?.textContent?.trim()).toBe(
        'Los documentos de esta categoría pasarán por el flujo de aprobación.',
      );
    });

    it('es accesible: switch con estado, etiqueta y ayuda asociadas (FR-013)', async () => {
      const { host, toggle, clickToggle } = await render(createData);

      expect(toggle().getAttribute('aria-checked')).toBe('false');
      expect(toggle().getAttribute('aria-labelledby')).toContain('requiresApproval-label');
      expect(toggle().getAttribute('aria-describedby')).toContain('requiresApproval-hint');
      expect(host.querySelector('.approval-field__state')?.getAttribute('aria-hidden')).toBe(
        'true',
      );

      await clickToggle();

      expect(toggle().getAttribute('aria-checked')).toBe('true');
    });
  });
  describe('editar (US1)', () => {
    const SCOPE =
      'Este cambio solo afecta a los documentos que se carguen desde ahora. Los documentos existentes conservan su estado actual.';

    it('muestra el valor guardado de la categoría', async () => {
      const on = await render(editData({ requiresApproval: true }));
      expect(on.toggle().getAttribute('aria-checked')).toBe('true');
      expect(on.state()).toBe('Sí');
      TestBed.resetTestingModule();

      const off = await render(editData({ requiresApproval: false }));
      expect(off.toggle().getAttribute('aria-checked')).toBe('false');
      expect(off.state()).toBe('No');
    });

    it('envía el nuevo valor al guardar', async () => {
      const { clickToggle, submit } = await render(editData({ requiresApproval: false }));

      await clickToggle();
      await submit();

      expect(update).toHaveBeenCalledWith(4, expect.objectContaining({ requiresApproval: true }));
    });

    it('no muestra el aviso de alcance en el formulario antes de guardar (FR-003)', async () => {
      const { host, clickToggle } = await render(editData({ requiresApproval: false }));

      await clickToggle();

      expect(host.textContent).not.toContain(SCOPE);
    });

    it('si el valor cambió, tras el éxito encola el aviso de alcance "Aprobación activada"', async () => {
      const { clickToggle, submit } = await render(editData({ requiresApproval: false }));

      await clickToggle();
      await submit();

      expect(success).toHaveBeenCalledWith('Categoría actualizada', expect.any(String));
      expect(info).toHaveBeenCalledWith('Aprobación activada', SCOPE, { queue: true });
      expect(success.mock.invocationCallOrder[0]).toBeLessThan(info.mock.invocationCallOrder[0]);
    });

    it('al desactivar, el aviso de alcance se titula "Aprobación desactivada"', async () => {
      const { clickToggle, submit } = await render(editData({ requiresApproval: true }));

      await clickToggle();
      await submit();

      expect(info).toHaveBeenCalledWith('Aprobación desactivada', SCOPE, { queue: true });
    });

    it('sin cambio de valor (o cambiado y devuelto) solo muestra el toast de éxito', async () => {
      const untouched = await render(editData({ requiresApproval: false }));
      await untouched.submit();
      expect(success).toHaveBeenCalledTimes(1);
      expect(info).not.toHaveBeenCalled();
      TestBed.resetTestingModule();

      const reverted = await render(editData({ requiresApproval: false }));
      await reverted.clickToggle();
      await reverted.clickToggle();
      await reverted.submit();
      expect(success).toHaveBeenCalledTimes(2);
      expect(info).not.toHaveBeenCalled();
    });

    it.each([
      [500, 'No fue posible guardar los cambios. Intente de nuevo.'],
      [
        403,
        'No es posible editar la categoría. Verifique sus permisos o que la categoría siga activa.',
      ],
    ])(
      'con un error %s conserva el valor, reactiva el interruptor y muestra el error',
      async (status, message) => {
        update.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
        const { host, form, toggle, clickToggle, submit } = await render(
          editData({ requiresApproval: false }),
        );

        await clickToggle();
        await submit();

        expect(form.controls.requiresApproval.value).toBe(true);
        expect(form.controls.requiresApproval.enabled).toBe(true);
        expect(toggle().getAttribute('aria-checked')).toBe('true');
        expect(host.querySelector('app-alert')?.textContent).toContain(message);
        expect(info).not.toHaveBeenCalled();
      },
    );

    it('cierra el diálogo con la categoría y el valor devuelto por el servidor', async () => {
      const { clickToggle, submit } = await render(editData({ requiresApproval: false }));

      await clickToggle();
      await submit();

      expect(close).toHaveBeenCalledWith({
        kind: 'updated',
        category: expect.objectContaining({ id: 4, requiresApproval: true }),
      });
    });
  });
  describe('crear (US2)', () => {
    const fillName = (form: Awaited<ReturnType<typeof render>>['form']) =>
      form.controls.name.setValue('Historias clínicas');

    it('el interruptor empieza en "No"', async () => {
      const { toggle, state } = await render(createData);

      expect(toggle().getAttribute('aria-checked')).toBe('false');
      expect(state()).toBe('No');
    });

    it('sin tocarlo, crea la categoría con requiresApproval: false', async () => {
      const { form, submit } = await render(createData);

      fillName(form);
      await submit();

      expect(create).toHaveBeenCalledWith(expect.objectContaining({ requiresApproval: false }));
    });

    it('activado, la crea con requiresApproval: true y sin aviso de alcance', async () => {
      const { form, clickToggle, submit } = await render(createData);

      fillName(form);
      await clickToggle();
      await submit();

      expect(create).toHaveBeenCalledWith(expect.objectContaining({ requiresApproval: true }));
      expect(success).toHaveBeenCalledWith('Categoría creada', expect.any(String));
      expect(info).not.toHaveBeenCalled();
    });

    it('mientras se guarda, el interruptor queda deshabilitado', async () => {
      create.mockReturnValue(new Observable());
      const { form, submit } = await render(createData);

      fillName(form);
      await submit();

      expect(form.controls.requiresApproval.disabled).toBe(true);
    });
    describe('advertencia de pocos aprobadores (US3)', () => {
      const FEW =
        'Hay menos de dos usuarios con permiso de aprobar. Los documentos que cargue un aprobador no podrán ser aprobados por él mismo.';

      it('aparece al activar con menos de dos aprobadores activos y no bloquea el guardado', async () => {
        // Un aprobador activo; el inactivo con permiso y el lector no cuentan.
        list.mockReturnValue(
          of(
            usersPage(
              approver(1),
              approver(2, { status: 'INACTIVE' }),
              approver(3, { role: 'READER' }),
              approver(4, { canApprove: false }),
            ),
          ),
        );
        const { host, warning, clickToggle } = await render(createData);
        expect(warning()).toBeNull();

        await clickToggle();

        expect(warning()?.textContent).toContain(FEW);
        const save = host.querySelector<HTMLButtonElement>('button[type="submit"]')!;
        expect(save.disabled).toBe(false);

        await clickToggle();

        expect(warning()).toBeNull();
      });

      it('no aparece con dos o más aprobadores activos', async () => {
        list.mockReturnValue(of(usersPage(approver(1), approver(2, { role: 'ADMIN' }))));
        const { warning, clickToggle } = await render(createData);

        await clickToggle();

        expect(warning()).toBeNull();
      });

      it('aparece al activar una categoría editada que estaba en "No"', async () => {
        const { warning, clickToggle } = await render(editData({ requiresApproval: false }));

        await clickToggle();

        expect(list).toHaveBeenCalledTimes(1);
        expect(warning()?.textContent).toContain(FEW);
      });

      it('no consulta usuarios ni advierte si la categoría ya requería aprobación', async () => {
        const { warning } = await render(editData({ requiresApproval: true }));

        expect(list).not.toHaveBeenCalled();
        expect(warning()).toBeNull();
      });

      it('si la consulta de usuarios falla, no advierte ni avisa del error y se puede guardar', async () => {
        list.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
        const { form, warning, clickToggle, submit } = await render(createData);

        await clickToggle();
        form.controls.name.setValue('Historias clínicas');
        await submit();

        expect(warning()).toBeNull();
        expect(success).toHaveBeenCalledWith('Categoría creada', expect.any(String));
        expect(info).not.toHaveBeenCalled();
        expect(create).toHaveBeenCalled();
      });

      it('con la advertencia visible se guarda con normalidad y no se repite tras guardar', async () => {
        const { form, warning, clickToggle, submit } = await render(createData);

        await clickToggle();
        expect(warning()).not.toBeNull();
        form.controls.name.setValue('Historias clínicas');
        await submit();

        expect(create).toHaveBeenCalledWith(expect.objectContaining({ requiresApproval: true }));
        const texts = [...success.mock.calls, ...info.mock.calls].flat();
        expect(texts).not.toContain(FEW);
      });

      it('se anuncia al aparecer (role="alert", FR-013)', async () => {
        const { warning, clickToggle } = await render(createData);

        await clickToggle();

        expect(warning()?.querySelector('[role="alert"]')).not.toBeNull();
      });

      it('no aparece mientras la consulta de usuarios sigue en curso', async () => {
        list.mockReturnValue(NEVER);
        const { form, warning, clickToggle, submit } = await render(createData);

        await clickToggle();
        expect(warning()).toBeNull();

        form.controls.name.setValue('Historias clínicas');
        await submit();
        expect(create).toHaveBeenCalled();
      });
    });
  });
});
