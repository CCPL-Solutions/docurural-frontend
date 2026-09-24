import { expect, test } from './support/fixtures';

test.describe('Inicio de sesión', () => {
  test('sin sesión, la raíz redirige al login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  });

  // R7: el returnUrl conserva todos los query params de la URL original.
  test('desde un enlace profundo, vuelve a él tras iniciar sesión', async ({ page }) => {
    await page.goto('/documents?q=acta&page=2');
    await expect(page).toHaveURL(/\/login\?returnUrl=/);

    await page.getByLabel('Correo electrónico').fill('ana@ierd.edu.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('correcta');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/documents\?q=acta&page=2$/);
  });

  // P8: una ruta desconocida muestra la página 404 en lugar de redirigir al login.
  test('una URL inexistente muestra la página 404', async ({ page }) => {
    await page.goto('/no-existe');

    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  test('con credenciales válidas entra al dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('ana@ierd.edu.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('correcta');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Bienvenido, Ana' })).toBeVisible();
  });

  test('con credenciales incorrectas muestra el error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('ana@ierd.edu.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByRole('alert')).toContainText('Correo o contraseña incorrectos');
    await expect(page).toHaveURL(/\/login/);
  });
});
