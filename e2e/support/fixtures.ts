import { Page, Route, test as base } from '@playwright/test';

/** Fecha fija de todas las pruebas: el dashboard muestra el mes actual. */
export const NOW = new Date('2026-09-23T12:00:00-05:00');

/** Clave de sesión de `src/environments/environment.ts` (lo que sirve `ng serve`). */
const SESSION_KEY = 'docurural.auth';

type Role = 'ADMIN' | 'EDITOR' | 'READER';

const user = (role: Role) => ({ id: 1, fullName: 'Ana Pérez', email: 'ana@ierd.edu.co', role });

export const DOCUMENTS = Array.from({ length: 12 }, (_, i) => {
  const id = i + 1;
  return {
    id,
    title: id === 3 ? 'Acta de consejo directivo' : `Documento ${id}`,
    category: id % 2 ? 'Actas' : 'Circulares',
    responsibleArea: 'Rectoría',
    documentDate: '2026-03-01',
    fileFormat: 'PNG',
    fileSizeBytes: 2048,
    uploadedBy: 'Ana Pérez',
    uploadedById: 1,
    createdAt: '2026-09-01T10:00:00-05:00',
    sensitivityLevel: 'INTERNAL',
  };
});

const CATEGORIES = [
  {
    id: 1,
    name: 'Actas',
    description: 'Actas de reuniones',
    status: 'ACTIVE',
    documentCount: 6,
    createdAt: '2026-01-10T09:00:00-05:00',
    createdBy: 'Ana Pérez',
    defaultSensitivityLevel: 'INTERNAL',
  },
  {
    id: 2,
    name: 'Matrículas',
    description: null,
    status: 'ACTIVE',
    documentCount: 6,
    createdAt: '2026-01-11T09:00:00-05:00',
    createdBy: 'Ana Pérez',
    defaultSensitivityLevel: 'RESTRICTED',
  },
];

// PNG de 1×1 px: el visor de PDF de Chromium no funciona en modo headless.
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** Simula la API del backend con datos deterministas. */
async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api/, '');
    const method = route.request().method();

    if (path === '/auth/login' && method === 'POST') {
      const { password } = route.request().postDataJSON() as { password: string };
      return password === 'correcta'
        ? json(route, { token: 'jwt', tokenType: 'Bearer', expiresIn: 3600, user: user('ADMIN') })
        : json(route, { message: 'Credenciales inválidas' }, 401);
    }
    if (path === '/auth/logout') return json(route, { message: 'ok' });

    if (path === '/dashboard/stats') {
      return json(route, {
        summary: {
          totalActiveDocuments: 12,
          documentsUploadedThisMonth: 4,
          topCategory: { name: 'Actas', count: 6 },
        },
        categoryDistribution: [
          { categoryName: 'Actas', count: 6, percentage: 50 },
          { categoryName: 'Circulares', count: 6, percentage: 50 },
        ],
        recentDocuments: DOCUMENTS.slice(0, 5).map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          responsibleArea: d.responsibleArea,
          fileFormat: d.fileFormat,
          createdAt: d.createdAt,
        })),
      });
    }

    if (path === '/documents/filter-options') {
      return json(route, {
        categories: CATEGORIES.map(({ id, name }) => ({ id, name })),
        users: [{ id: 1, fullName: 'Ana Pérez' }],
      });
    }
    if (path === '/documents' && method === 'GET') {
      const q = url.searchParams.get('q')?.toLowerCase();
      const page = Number(url.searchParams.get('page') ?? 1);
      const size = Number(url.searchParams.get('size') ?? 10);
      const found = q ? DOCUMENTS.filter((d) => d.title.toLowerCase().includes(q)) : DOCUMENTS;
      return json(route, {
        totalDocuments: found.length,
        totalPages: Math.max(1, Math.ceil(found.length / size)),
        currentPage: page,
        pageSize: size,
        documents: found.slice((page - 1) * size, page * size),
        searchTerm: q ?? null,
        activeFilters: null,
      });
    }
    const view = path.match(/^\/documents\/(\d+)\/view$/);
    if (view) return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1PX });
    const detail = path.match(/^\/documents\/(\d+)$/);
    if (detail && method === 'GET') {
      const doc = DOCUMENTS.find((d) => d.id === Number(detail[1]));
      if (!doc) return json(route, { message: 'No existe' }, 404);
      return json(route, {
        ...doc,
        description: 'Documento de prueba',
        category: { id: 1, name: doc.category },
        originalFileName: `${doc.title}.png`,
        uploadedBy: { id: doc.uploadedById, fullName: doc.uploadedBy },
      });
    }

    if (path === '/categories') {
      return json(route, {
        totalCategories: CATEGORIES.length,
        activeCategories: CATEGORIES.length,
        inactiveCategories: 0,
        categories: CATEGORIES,
      });
    }
    if (path === '/users') {
      return json(route, {
        totalUsers: 2,
        users: [
          {
            ...user('ADMIN'),
            status: 'ACTIVE',
            createdAt: '2026-01-05T08:00:00-05:00',
            lastLogin: '2026-09-22T17:30:00-05:00',
          },
          {
            id: 2,
            fullName: 'Luis Gómez',
            email: 'luis@ierd.edu.co',
            role: 'EDITOR',
            status: 'INACTIVE',
            createdAt: '2026-02-01T08:00:00-05:00',
            lastLogin: null,
          },
        ],
      });
    }

    return json(route, { message: `Ruta no simulada: ${method} ${path}` }, 501);
  });
}

export const test = base.extend<{ loginAs: (role?: Role) => Promise<void> }>({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(NOW);
    await mockApi(page);
    await use(page);
  },
  loginAs: async ({ page }, use) => {
    await use(async (role = 'ADMIN') => {
      const session = { token: 'jwt', user: user(role), expiresAt: NOW.getTime() + 3_600_000 };
      await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
        SESSION_KEY,
        JSON.stringify(session),
      ] as const);
    });
  },
});

export { expect } from '@playwright/test';
