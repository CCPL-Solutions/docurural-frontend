// Configuración base de Vitest que el builder `@angular/build:unit-test` fusiona con la suya
// (`runnerConfig` en angular.json). Solo define la cobertura: el resto lo gestiona Angular.
//
// Umbrales (regla CAL-07 de docs/constitucion-borrador.md): funcionan como trinquete, así que
// solo pueden subir. Objetivo final: ≥ 80 % de líneas en core/ y shared/utils/, y ≥ 70 % global.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        // Línea base global medida al cerrar la Fase 8 (55,07 % de líneas). Cada fase la sube.
        statements: 57,
        branches: 58,
        functions: 46,
        lines: 55,
        '**/src/app/core/**/*.ts': { lines: 80 },
        '**/src/app/shared/utils/**/*.ts': { lines: 80 },
      },
    },
  },
});
