import { defineConfig, devices } from '@playwright/test';

/**
 * E2E de humo (Fase 1, tarea 1.8 de docs/plan-remediacion.md). La API siempre está simulada con
 * `page.route` (e2e/support/fixtures.ts), así que no dependen del backend.
 *
 * - `functional`: flujos críticos a 1280 px. Son los que ejecuta la CI (`npm run e2e:ci`, que filtra con `--test-project functional`).
 * - `desktop` y `mobile-600`: capturas de referencia a 1280 px y 600 px (breakpoint `bp.sm`).
 *   Solo en local: las referencias son específicas del sistema operativo (sufijo `-win32`).
 *
 * Ejecutar con `npm run e2e` (levanta `ng serve` mediante el target `e2e`).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    // Tolerancia para el antialiasing de fuentes entre ejecuciones.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? 'http://localhost:4200',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'functional',
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'desktop',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-600',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 600, height: 900 } },
    },
  ],
});
