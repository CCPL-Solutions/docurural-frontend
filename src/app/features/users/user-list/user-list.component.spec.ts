import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { User } from '@core/models/user.model';
import { UserListResponse } from '@core/models/user-list.model';
import { NotificationService } from '@core/services/notification.service';
import { UsersService } from '@core/services/users.service';
import { UserListComponent } from './user-list.component';

const user = (id: number, fullName: string, overrides: Partial<User> = {}): User => ({
  id,
  fullName,
  email: `u${id}@ierd.edu.co`,
  role: 'EDITOR',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  lastLogin: null,
  canApprove: false,
  ...overrides,
});
const page = (...users: User[]): UserListResponse => ({ totalUsers: users.length, users });

describe('UserListComponent', () => {
  let responses: Subject<UserListResponse>[];
  let list: ReturnType<typeof vi.fn>;
  let notifications: { httpError: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  async function render() {
    responses = [];
    list = vi.fn(() => {
      const response = new Subject<UserListResponse>();
      responses.push(response);
      return response;
    });
    notifications = { httpError: vi.fn(), success: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UsersService, useValue: { list } },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    return { fixture, component: fixture.componentInstance };
  }

  it('carga el listado al iniciarse (ngOnInit), no al construirse', async () => {
    const { fixture } = await render();
    expect(list).toHaveBeenCalledOnce();

    responses[0].next(page(user(1, 'Ana Pérez')));
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ana Pérez');
  });

  // R2: al cambiar de orden rápido, una respuesta anterior que llega tarde ya no pisa a la última.
  it('R2: al cambiar de orden rápido, solo cuenta la última respuesta', async () => {
    const { component } = await render();
    responses[0].next(page(user(1, 'Inicial')));

    component['onSortChange']('fullNameDesc');
    component['onSortChange']('createdAtDesc');
    responses[2].next(page(user(3, 'Última')));
    responses[1].next(page(user(2, 'Tardía')));

    expect(list).toHaveBeenLastCalledWith('createdAt', 'desc');
    expect(component['users']().map((u) => u.fullName)).toEqual(['Última']);
  });

  it('marca con "Aprobador" solo a quien tiene el permiso, atenuado si está inactivo', async () => {
    const { fixture } = await render();
    responses[0].next(
      page(
        user(1, 'Activo', { canApprove: true }),
        user(2, 'Inactivo', { canApprove: true, status: 'INACTIVE' }),
        user(3, 'Sin permiso'),
      ),
    );
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const badgesIn = (row: Element) => row.querySelectorAll('app-approver-badge .badge');
    const rows = Array.from(host.querySelectorAll('tbody tr'));
    expect(badgesIn(rows[0])[0]?.classList).toContain('badge--accent');
    expect(badgesIn(rows[1])[0]?.classList).toContain('badge--neutral');
    expect(badgesIn(rows[2])).toHaveLength(0);

    const cards = Array.from(host.querySelectorAll('.user-card'));
    expect(cards.map((card) => badgesIn(card).length)).toEqual([1, 1, 0]);
  });

  it('un error se notifica y no impide recargar', async () => {
    const { component } = await render();
    responses[0].error(new HttpErrorResponse({ status: 500 }));

    expect(notifications.httpError).toHaveBeenCalledOnce();
    expect(component['loading']()).toBe(false);

    component['loadUsers']();
    responses[1].next(page(user(1, 'Ana Pérez')));

    expect(component['users']()).toHaveLength(1);
  });
});
