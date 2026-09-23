import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { Category } from '@core/models/category.model';
import { CategoriesService } from '@core/services/categories.service';
import {
  CategoryToggleAction,
  CategoryToggleStatusDialogComponent,
} from './category-toggle-status-dialog.component';

const category = (documentCount: number): Category => ({
  id: 9,
  name: 'Actas',
  description: null,
  status: 'ACTIVE',
  documentCount,
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'Ana Pérez',
  defaultSensitivityLevel: 'INTERNAL',
});

describe('CategoryToggleStatusDialogComponent', () => {
  let updateStatus: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn>;

  async function render(action: CategoryToggleAction, documentCount = 0) {
    close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { category: category(documentCount), action } },
        { provide: MatDialogRef, useValue: { close, disableClose: false } },
        { provide: CategoriesService, useValue: { updateStatus } },
      ],
    });
    const fixture = TestBed.createComponent(CategoryToggleStatusDialogComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const confirmButton = () => host.querySelectorAll('button')[1];
    return { fixture, host, confirmButton };
  }

  beforeEach(() => {
    updateStatus = vi.fn(() => of({ id: 9, status: 'INACTIVE', message: 'Categoría desactivada' }));
  });

  it('al desactivar avisa de los documentos que seguirán accesibles (plural)', async () => {
    const { host } = await render('deactivate', 3);

    expect(host.querySelector('h2')?.textContent).toContain('Desactivar categoría');
    expect(host.querySelector('.dialog__message')?.textContent).toContain('"Actas"');
    expect(host.querySelector('.dialog__docs')?.textContent).toContain(
      '3 documentos seguirán siendo accesibles',
    );
  });

  it('con un solo documento usa el singular', async () => {
    const { host } = await render('deactivate', 1);

    expect(host.querySelector('.dialog__docs')?.textContent).toContain(
      '1 documento seguirá siendo accesible',
    );
  });

  it('al reactivar no muestra la tarjeta de documentos', async () => {
    const { host, confirmButton } = await render('activate', 3);

    expect(host.querySelector('h2')?.textContent).toContain('Reactivar categoría');
    expect(host.querySelector('.dialog__docs')).toBeNull();
    expect(confirmButton().textContent).toContain('Activar categoría');
  });

  it('confirma con el nuevo estado', async () => {
    const { fixture, confirmButton } = await render('deactivate');

    confirmButton().click();
    await fixture.whenStable();

    expect(updateStatus).toHaveBeenCalledWith(9, 'INACTIVE');
    expect(close).toHaveBeenCalledWith({
      success: true,
      message: 'Categoría desactivada',
      categoryId: 9,
      newStatus: 'INACTIVE',
    });
  });

  it.each([
    [400, 'La categoría ya tiene este estado', true],
    [403, 'No tiene permisos para realizar esta acción', true],
    [404, 'La categoría ya no existe', true],
    [500, 'No fue posible actualizar el estado', false],
  ])('un %i muestra su mensaje', async (status, message, blocks) => {
    updateStatus = vi.fn(() => throwError(() => new HttpErrorResponse({ status })));
    const { fixture, host, confirmButton } = await render('deactivate');

    confirmButton().click();
    await fixture.whenStable();

    expect(host.querySelector('app-alert')?.textContent).toContain(message);
    expect(confirmButton().disabled).toBe(blocks);
  });
});
