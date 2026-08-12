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
```

## Configuración por entorno

`src/environments/environment.ts` (desarrollo) y `environment.prod.ts` (producción)
definen `apiBaseUrl`. En producción es relativo (`/api`): Nginx en el servidor
proxea `/api/` hacia el backend de Spring Boot en `localhost:8080`.

## CI/CD

El pipeline de GitHub Actions replica el del backend: `ci.yml` compila y prueba en
cada push/PR; `cd-dev.yml`, `cd-qa.yml` y `cd-prod.yml` despliegan a Desarrollo, QA
y Producción sobre runners self-hosted (provistos por
[`docurural-infra-test`](https://github.com/CCPL-Solutions/docurural-infra-test)),
con health check y rollback automático. La estrategia de ramas, el esquema de
versionado (`x.y.z-rc.N`) y las transiciones del tablero de GitHub Projects están
documentadas en `docurural-backend/docs/ci-cd.md` — front y back siguen el mismo
flujo, cada uno moviendo su propia issue en el Project.
