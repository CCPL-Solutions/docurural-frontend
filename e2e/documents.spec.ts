import { expect, test } from './support/fixtures';

test.describe('Documentos', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('ADMIN');
    await page.goto('/documents');
    await expect(page.getByText('Mostrando 1–10 de 12 documentos')).toBeVisible();
  });

  test('lista la primera página', async ({ page }) => {
    await expect(page.locator('table').getByText('Documento 1', { exact: true })).toBeVisible();
    await expect(page.locator('table').getByText('Documento 11', { exact: true })).toHaveCount(0);
  });

  test('busca por texto', async ({ page }) => {
    const request = page.waitForRequest((r) => new URL(r.url()).searchParams.get('q') === 'acta');
    await page.getByLabel('Campo de búsqueda de documentos').fill('acta');
    await page.getByLabel('Campo de búsqueda de documentos').press('Enter');
    await request;

    await expect(page.getByText('Se encontraron 1 documento para "acta"')).toBeVisible();
    await expect(page.locator('table').getByText('Acta de consejo directivo')).toBeVisible();
  });

  test('pagina a la segunda página', async ({ page }) => {
    await page.getByRole('button', { name: 'Página 2' }).click();

    await expect(page.getByText('Mostrando 11–12 de 12 documentos')).toBeVisible();
    await expect(page.locator('table').getByText('Documento 11', { exact: true })).toBeVisible();
  });

  // D35: el título es un enlace (se puede abrir en otra pestaña), no un botón con router.navigate.
  test('abre el detalle de un documento desde el título', async ({ page }) => {
    const title = page.locator('table').getByRole('link', { name: 'Documento 1', exact: true });
    await expect(title).toHaveAttribute('href', '/documents/1');
    await title.click();

    await expect(page).toHaveURL(/\/documents\/1$/);
    await expect(page.getByRole('heading', { name: 'Documento 1', level: 1 })).toBeVisible();
  });

  // El snackbar y el toast se cargan con el primer aviso (Fase 4, tarea 4.10): este flujo comprueba
  // que el toast se sigue mostrando.
  test('muestra un toast si falla la descarga', async ({ page }) => {
    await page.route('**/api/documents/*/download', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Error de almacenamiento' }),
      }),
    );

    await page
      .locator('table')
      .getByRole('button', { name: 'Descargar documento Documento 1', exact: true })
      .click();

    const toast = page.locator('app-toast');
    await expect(toast.getByText('No se pudo descargar el documento')).toBeVisible();
    await expect(toast.getByText('Error de almacenamiento')).toBeVisible();
  });

  test('el diálogo de subida valida los campos obligatorios', async ({ page }) => {
    await page.getByRole('button', { name: 'Subir documento' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Subir documento' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Cargar documento' }).click();

    await expect(dialog.getByText('Seleccione un archivo para continuar.')).toBeVisible();
    await expect(dialog.getByText('El título es obligatorio.')).toBeVisible();
  });

  // R11 (corregido en la Fase 3, tarea 3.6): `new Date('YYYY-MM-DD')` se interpretaba en UTC y, en
  // Colombia (UTC-5), la fecha del documento se mostraba un día antes. El pipe `date` la interpreta
  // como fecha local.
  test('R11: muestra la fecha del documento sin desfase horario', async ({ page }) => {
    await page.locator('table').getByRole('link', { name: 'Ver documento' }).first().click();
    await expect(page.getByText('01/03/2026')).toBeVisible({ timeout: 2000 });
  });
});
