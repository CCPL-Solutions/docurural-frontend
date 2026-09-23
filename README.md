# DocuRural Frontend

Interfaz web de DocuRural — gestión documental y archivo digital para la IERD Mina y
Ticha (escuela rural en Guachetá, Cundinamarca). Aplicación Angular que consume la
API de [`docurural-backend`](https://github.com/CCPL-Solutions/docurural-backend).

## Stack

Angular 21 (standalone, sin zone.js), Angular Material, Vitest (tests unitarios),
Playwright (E2E), ESLint y Prettier.

## Comandos esenciales

```bash
npm ci                 # Instalar dependencias
npm start               # Servidor de desarrollo en http://localhost:4200
npm run build            # Build de producción en dist/docurural-frontend/browser
npm test                 # Pruebas en modo watch
npm run test:ci          # Pruebas en modo CI (sin watch, con cobertura)
npm run format:check     # Verificar formato con Prettier
npm run lint             # Analizar el código con ESLint (angular-eslint)
npm run check:styles     # Verificar el uso de tokens de diseño y breakpoints
npm run e2e              # E2E con Playwright: flujos y capturas de referencia (ver "Tests")
```

Las convenciones del proyecto están en `CLAUDE.md` y en `docs/`.

## Tests

### Unitarios (Vitest)

```bash
npm test                 # Modo watch
npm run test:ci          # Una ejecución con cobertura (lo que corre la CI)
```

- Los tests van junto al archivo que prueban (`*.spec.ts`) y no necesitan navegador ni backend.
- `npm run test:ci` aplica umbrales de cobertura (`vitest-base.config.ts`): `core/` ≥ 80 % de
  líneas y una línea base global que **solo puede subir**. Si no se cumplen, la CI falla. El
  informe HTML queda en `coverage/docurural-frontend/index.html`.
- Algunos tests usan `it.fails`: documentan un bug conocido (riesgos `Rxx` de
  `docs/auditoria-consistencia.md`) y pasan mientras el bug exista. Al corregirlo, el test empieza a
  fallar y hay que cambiarlo a `it`.

### E2E (Playwright)

**Preparación (una sola vez por máquina):** descargar el navegador, unos 115 MB.

```bash
npx playwright install chromium
```

**Ejecución:**

```bash
npm run e2e                               # Todo: flujos + capturas de referencia
npm run e2e:ci                            # Solo los flujos (lo que corre la CI)
npx ng e2e --grep Documentos              # Solo los tests cuyo nombre coincide
npm run e2e -- --update-snapshots         # Aceptar un cambio visual intencionado
```

- `ng e2e` levanta `ng serve` automáticamente. **No hace falta backend**: la API se simula en
  `e2e/support/fixtures.ts`, con un reloj fijo y la zona horaria `America/Bogota`.
- El informe queda en `playwright-report/index.html` (`npx playwright show-report`).
- Proyectos de `playwright.config.ts`:
  - `functional`: flujos críticos a 1280 px. **Se ejecutan en la CI.**
  - `desktop` y `mobile-600`: capturas de referencia de cada página a 1280 px y 600 px, en
    `e2e/visual.spec.ts-snapshots/`. **Solo en local**: el renderizado de fuentes cambia entre
    sistemas operativos y las referencias actuales son de Windows (sufijo `-win32`). En macOS o
    Linux, la primera ejecución falla por falta de referencia: generarlas con
    `npm run e2e -- --update-snapshots` y no subirlas salvo acuerdo del equipo.
- Algunos E2E usan `test.fail()` con el mismo sentido que `it.fails` en los unitarios.

## Configuración por entorno

Cada archivo de `src/environments/` define `apiBaseUrl` y `tokenStorageKey`:

| Archivo                  | Configuración (`angular.json`)                                     | `apiBaseUrl`                |
| ------------------------ | ------------------------------------------------------------------ | --------------------------- |
| `environment.ts`         | `development` (`npm start`)                                        | `http://localhost:8080/api` |
| `environment.develop.ts` | `develop` (`npm run start:develop`, con `proxy.conf.develop.json`) | `/api`                      |
| `environment.qa.ts`      | `qa` (`npm run start:qa`, con `proxy.conf.qa.json`)                | `/api`                      |
| `environment.prod.ts`    | `production` (`npm run build`)                                     | `/api`                      |

En los entornos desplegados, Nginx proxea `/api/` hacia el backend de Spring Boot en
`localhost:8080`.

## CI/CD

El pipeline de GitHub Actions replica el del backend: `ci.yml` verifica formato
(Prettier), analiza el código (ESLint y `check:styles`), ejecuta los tests unitarios con
umbrales de cobertura, compila y, en un job paralelo, ejecuta los E2E de flujos. Corre en cada
push a ramas `feature/**`, `bugfix/**` y `hotfix/**` (no se ejecuta en PR); `cd-dev.yml`, `cd-qa.yml` y `cd-prod.yml` despliegan a Desarrollo, QA
y Producción sobre runners self-hosted (provistos por
[`docurural-infra-test`](https://github.com/CCPL-Solutions/docurural-infra-test)),
con health check y rollback automático. La estrategia de ramas, el esquema de
versionado (`x.y.z-rc.N`) y las transiciones del tablero de GitHub Projects están
documentadas en `docurural-backend/docs/ci-cd.md` — front y back siguen el mismo
flujo, cada uno moviendo su propia issue en el Project.
