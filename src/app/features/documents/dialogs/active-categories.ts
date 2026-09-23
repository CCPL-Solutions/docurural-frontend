import { Signal, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Category } from '@core/models/category.model';
import { CategoriesService } from '@core/services/categories.service';

export interface ActiveCategories {
  readonly categories: Signal<Category[]>;
  readonly loading: Signal<boolean>;
  readonly loadError: Signal<boolean>;
  load(): void;
}

/**
 * Categorías activas para los selectores de los diálogos de documentos (tarea 5.11). Cada diálogo
 * tiene su propio estado. Debe llamarse en un contexto de inyección (inicializador de campo).
 */
export function injectActiveCategories(): ActiveCategories {
  const categoriesService = inject(CategoriesService);
  const categories = signal<Category[]>([]);
  const loading = signal(false);
  const loadError = signal(false);

  return {
    categories: categories.asReadonly(),
    loading: loading.asReadonly(),
    loadError: loadError.asReadonly(),
    load: () => {
      loading.set(true);
      loadError.set(false);
      categoriesService
        .list('name', 'asc')
        .pipe(finalize(() => loading.set(false)))
        .subscribe({
          next: (res) => categories.set(res.categories.filter((c) => c.status === 'ACTIVE')),
          error: () => loadError.set(true),
        });
    },
  };
}
