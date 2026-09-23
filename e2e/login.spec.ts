import { expect, test } from './support/fixtures';

test.describe('Inicio de sesión', () => {
  test('sin sesión, la raíz redirige al login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
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
