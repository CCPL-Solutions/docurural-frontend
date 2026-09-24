// Capturas de referencia por página (Fase 1, tarea 1.8). Son la base visual con la que se compara
// la Fase 4 (estilos y tokens): `npm run e2e` falla si una pantalla cambia más de lo tolerado.
// Para aceptar un cambio visual intencionado: `npm run e2e -- --update-snapshots`.
import { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';

// La app hace scroll dentro de un contenedor interno, así que `fullPage` no captura lo que queda
// bajo el pliegue: se agranda la ventana antes de navegar.
const CAPTURE_HEIGHT = 2000;

async function tallViewport(page: Page): Promise<void> {
  const width = page.viewportSize()?.width ?? 1280;
  await page.setViewportSize({ width, height: CAPTURE_HEIGHT });
}

async function settle(page: Page, waitFor: string): Promise<void> {
  await expect(page.getByText(waitFor).filter({ visible: true }).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe('Capturas de referencia', () => {
  test('login', async ({ page }) => {
    await tallViewport(page);
    await page.goto('/login');
    await settle(page, 'Iniciar sesión');
    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  const authenticatedPages = [
    { name: 'dashboard', url: '/dashboard', waitFor: 'Total de documentos' },
    { name: 'documents', url: '/documents', waitFor: 'Mostrando 1–10 de 12 documentos' },
    { name: 'document-detail', url: '/documents/1', waitFor: 'Documento de prueba' },
    { name: 'users', url: '/users', waitFor: 'Luis Gómez' },
    { name: 'categories', url: '/categories', waitFor: 'Matrículas' },
  ];

  for (const { name, url, waitFor } of authenticatedPages) {
    test(name, async ({ page, loginAs }) => {
      await loginAs('ADMIN');
      await tallViewport(page);
      await page.goto(url);
      await settle(page, waitFor);
      // El reloj fijo (fixtures.ts) congela la animación de Chart.js: se enmascara el canvas.
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        mask: [page.locator('canvas')],
      });
    });
  }
});
