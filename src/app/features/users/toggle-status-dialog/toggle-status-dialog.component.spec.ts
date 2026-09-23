import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { User } from '@core/models/user.model';
import { UsersService } from '@core/services/users.service';
import {
  ToggleStatusDialogComponent,
  ToggleStatusDialogData,
} from './toggle-status-dialog.component';

const user: User = {
  id: 4,
  fullName: 'Ana Pérez',
  email: 'ana@minayticha.edu.co',
  role: 'EDITOR',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  lastLogin: null,
};

describe('ToggleStatusDialogComponent', () => {
  let updateStatus: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;

  async function render(action: ToggleStatusDialogData['action']) {
    close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { user, action } },
        { provide: MatDialogRef, useValue: { close, disableClose: false } },
        { provide: UsersService, useValue: { updateStatus } },
      ],
    });
    const fixture = TestBed.createComponent(ToggleStatusDialogComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const confirmButton = () => host.querySelectorAll('button')[1];
    return { fixture, host, confirmButton };
  }

  beforeEach(() => {
    updateStatus = vi.fn(() => of({ message: 'Usuario desactivado' }));
  });

  it('al desactivar pide confirmación con el nombre del usuario', async () => {
    const { host, confirmButton } = await render('deactivate');

    expect(host.querySelector('h2')?.textContent).toContain('¿Desactivar usuario?');
    expect(host.querySelector('.dialog__message')?.textContent).toContain(
      '¿Está seguro de desactivar la cuenta de Ana Pérez?',
    );
    expect(confirmButton().textContent).toContain('Desactivar');
  });

  it('al activar cambia los textos', async () => {
    const { host, confirmButton } = await render('activate');

    expect(host.querySelector('h2')?.textContent).toContain('¿Activar usuario?');
    expect(host.querySelector('.dialog__hint')?.textContent).toContain(
      'El usuario podrá volver a acceder al sistema.',
    );
    expect(confirmButton().textContent).toContain('Activar');
  });

  it('confirma con el nuevo estado y devuelve el mensaje del backend', async () => {
    const { fixture, confirmButton } = await render('deactivate');

    confirmButton().click();
    await fixture.whenStable();

    expect(updateStatus).toHaveBeenCalledWith(4, 'INACTIVE');
    expect(close).toHaveBeenCalledWith({ success: true, message: 'Usuario desactivado' });
  });

  it('un 403 bloquea la acción y explica el motivo', async () => {
    updateStatus = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 403 })));
    const { fixture, host, confirmButton } = await render('deactivate');

    confirmButton().click();
    await fixture.whenStable();

    expect(host.querySelector('app-alert')?.textContent).toContain(
      'No puede desactivar su propia cuenta',
    );
    expect(confirmButton().disabled).toBe(true);
  });

  it('otro error permite reintentar', async () => {
    updateStatus = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 500 })));
    const { fixture, host, confirmButton } = await render('activate');

    confirmButton().click();
    await fixture.whenStable();

    expect(host.querySelector('app-alert')?.textContent).toContain('Ocurrió un error inesperado');
    expect(confirmButton().disabled).toBe(false);
  });
});
