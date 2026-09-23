import { expect, test } from './support/fixtures';

test.describe('Dashboard', () => {
  // Fase 5 (tarea 5.4, D16/P3): un error de carga se comunica con un toast más un estado vacío,
  // como en las listas, en lugar de un bloque de error en la página.
  test('si falla la carga muestra un toast y el estado vacío con reintento', async ({
    page,
    loginAs,
  }) => {
    let fail = true;
    await page.route('**/api/dashboard/stats', async (route) => {
      if (!fail) return route.fallback();
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Servicio no disponible' }),
      });
    });
    await loginAs('ADMIN');
    await page.goto('/dashboard');

    const toast = page.locator('app-toast');
    await expect(toast.getByText('No se pudo cargar el panel de control')).toBeVisible();
    await expect(toast.getByText('Servicio no disponible')).toBeVisible();
    await expect(page.getByText('No hay datos del panel de control')).toBeVisible();

    fail = false;
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByText('Total de documentos', { exact: true })).toBeVisible();
  });
});
