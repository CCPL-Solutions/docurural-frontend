import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Category } from '@core/models/category.model';
import { CategoryListResponse } from '@core/models/category-list.model';
import { CategoriesService } from '@core/services/categories.service';
import { NotificationService } from '@core/services/notification.service';
import { CategoryListComponent } from './category-list.component';

const category = (id: number, name: string): Category => ({
  id,
  name,
  description: null,
  status: 'ACTIVE',
  documentCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'Ana Pérez',
  defaultSensitivityLevel: 'INTERNAL',
});
const page = (...categories: Category[]): CategoryListResponse => ({
  totalCategories: categories.length,
  activeCategories: categories.length,
  inactiveCategories: 0,
  categories,
});

describe('CategoryListComponent', () => {
  let responses: Subject<CategoryListResponse>[];
  let list: ReturnType<typeof vi.fn>;
  let notifications: { httpError: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  async function render() {
    responses = [];
    list = vi.fn(() => {
      const response = new Subject<CategoryListResponse>();
      responses.push(response);
      return response;
    });
    notifications = { httpError: vi.fn(), success: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CategoriesService, useValue: { list } },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    const fixture = TestBed.createComponent(CategoryListComponent);
    await fixture.whenStable();
    return { fixture, component: fixture.componentInstance };
  }

  it('carga el listado al iniciarse (ngOnInit), no al construirse', async () => {
    const { fixture } = await render();
    expect(list).toHaveBeenCalledOnce();

    responses[0].next(page(category(1, 'Actas')));
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Actas');
  });

  // R2: al cambiar de orden rápido, una respuesta anterior que llega tarde ya no pisa a la última.
  it('R2: al cambiar de orden rápido, solo cuenta la última respuesta', async () => {
    const { component } = await render();
    responses[0].next(page(category(1, 'Inicial')));

    component['onSortChange']('nameDesc');
    component['onSortChange']('nameAsc');
    responses[2].next(page(category(3, 'Última')));
    responses[1].next(page(category(2, 'Tardía')));

    expect(component['categories']().map((c) => c.name)).toEqual(['Última']);
  });

  it('un error se notifica y no impide recargar', async () => {
    const { component } = await render();
    responses[0].error(new HttpErrorResponse({ status: 500 }));

    expect(notifications.httpError).toHaveBeenCalledOnce();
    expect(component['loading']()).toBe(false);

    component['loadCategories']();
    responses[1].next(page(category(1, 'Actas')));

    expect(component['totalCategories']()).toBe(1);
  });
});
