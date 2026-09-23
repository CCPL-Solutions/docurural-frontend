# DocuRural Frontend

Interfaz web de DocuRural — gestión documental y archivo digital para la IERD Mina y
Ticha (escuela rural en Guachetá, Cundinamarca). Aplicación Angular que consume la
API de [`docurural-backend`](https://github.com/CCPL-Solutions/docurural-backend).

## Stack

Angular 21 (standalone, sin zone.js), Angular Material, Vitest como test runner,
Prettier para formato.

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
```

Las convenciones del proyecto están en `CLAUDE.md` y en `docs/`.

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
(Prettier), analiza el código (ESLint y `check:styles`), prueba y compila en cada push a
ramas `feature/**`, `bugfix/**` y `hotfix/**` (no se ejecuta en PR); `cd-dev.yml`, `cd-qa.yml` y `cd-prod.yml` despliegan a Desarrollo, QA
y Producción sobre runners self-hosted (provistos por
[`docurural-infra-test`](https://github.com/CCPL-Solutions/docurural-infra-test)),
con health check y rollback automático. La estrategia de ramas, el esquema de
versionado (`x.y.z-rc.N`) y las transiciones del tablero de GitHub Projects están
documentadas en `docurural-backend/docs/ci-cd.md` — front y back siguen el mismo
flujo, cada uno moviendo su propia issue en el Project.
