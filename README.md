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
npm start               # Servidor de desarrollo en http://localhost:4200 (en español)
npm run start:en         # Servidor de desarrollo en inglés
npm run build            # Build de producción: un build por idioma en dist/docurural-frontend/browser/{es,en}
npm run extract-i18n     # Extraer los textos a src/locale/messages.xlf
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

## Idiomas (i18n)

La interfaz está en español (`es-CO`, idioma de origen) y en inglés (`en`), con
[`@angular/localize`](https://angular.dev/guide/i18n): hay **un build por idioma** y cambiar de
idioma recarga la página. En los entornos desplegados, Nginx sirve cada build en `/es/` y `/en/`
y redirige la raíz según el idioma del navegador (`docurural-infra-test`). El enlace para cambiar de
idioma (`<app-language-switcher>`, en el login y en el menú lateral) solo aparece en esos builds;
con `npm start` hay un único idioma.

- **Plantillas:** todo texto visible lleva `i18n` (o `i18n-<atributo>`) con un ID personalizado,
  `@@<feature>.<pantalla>.<clave>` en inglés. Los recuentos usan ICU (`{n, plural, =1 {…} other {…}}`).
  ESLint (`@angular-eslint/template/i18n`) falla si falta.
- **TypeScript:** `` $localize`:@@id:Texto ${valor}:nombre:` `` (toasts, `*.messages.ts`, etiquetas
  de modelos, títulos de ruta, formatos de fecha). Un mismo texto se reutiliza con el mismo ID.
- **Fechas:** `LOCALE_ID` lo fija cada build; los patrones de `shared/utils/date-formats.ts` también
  se traducen.
- **Puntuación:** terminan en punto las oraciones completas (descripciones de toasts, errores,
  validaciones y pistas); no lo llevan títulos, etiquetas, botones, placeholders ni tooltips.
- **Al añadir o cambiar un texto:** `npm run extract-i18n` y actualizar
  `src/locale/messages.en.xlf` (añadir la unidad con su `<target>`, o corregir el `<target>` si
  cambió el texto de origen). `npm run build` falla si falta una traducción
  (`i18nMissingTranslation: error`).
- **No se traducen:** los nombres propios (DocuRural, IERD Miña y Ticha), las áreas responsables
  (son valores que se guardan en el backend) ni los mensajes que devuelve el backend.

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
