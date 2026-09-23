# CLAUDE.md — docurural-frontend

Guía para agentes de código (Claude Code) y personas que trabajan en este repositorio.
Frontend Angular de DocuRural (gestión documental de la IERD Mina y Ticha). Consume la API de
`docurural-backend`.

> **Fuente de verdad de las reglas:** `docs/constitucion-borrador.md` (borrador de la constitución
> de Spec Kit). Este archivo solo resume lo imprescindible y **no** debe duplicar esas reglas: si
> algo cambia, se cambia allí.
>
> **Remediación en curso:** `docs/plan-remediacion.md` (diagnóstico en
> `docs/auditoria-consistencia.md`). Parte del código aún no cumple las reglas; no copies un patrón
> solo porque ya exista: comprueba la regla.

## Stack

Angular 21 (standalone, **zoneless**, signals), Angular Material 21, RxJS 7.8, TypeScript 5.9 en
modo `strict`, Vitest (builder `@angular/build:unit-test`), ESLint (angular-eslint 21), Prettier.
Para lo idiomático de Angular, usa la skill `angular-developer` (`.claude/skills/`).

## Comandos

```bash
npm ci                   # Instalar dependencias
npm start                # Dev server (http://localhost:4200, API en localhost:8080)
npm run start:develop    # Dev server con proxy al backend de Desarrollo
npm run build            # Build de producción
npm test                 # Tests en modo watch
npm run test:ci          # Tests sin watch y con cobertura (lo que corre la CI)
npm run lint             # ESLint
npm run check:styles     # Tokens de diseño y breakpoints (scripts/check-styles.mjs)
npm run format:check     # Prettier
```

Antes de dar un cambio por terminado: `npm run lint`, `npm run test:ci`, `npm run build` y
`npm run format:check` en verde.

## Arquitectura

```
src/app/
  core/       guards, interceptors, models, services  → transversal y singleton
  features/   auth, categories, dashboard, documents, users  → una carpeta por feature
  shared/     components, layout, pipes, sensitivity  → UI reutilizable sin lógica de negocio
src/styles/   tokens de diseño (_tokens.scss) y parciales globales (ver src/styles/README.md)
```

- El HTTP vive solo en `core/services/`, con un servicio por recurso y URLs construidas con
  `environment.apiBaseUrl`.
- Una feature no importa internals de otra (lo verifica ESLint).
- El estado es de signals. La sesión es el único estado global (`AuthService`).

## Convenciones clave

- **Idioma:** el código (identificadores, archivos, rutas, clases CSS) va en **inglés**. Los
  comentarios, los textos de la interfaz, la documentación, el CHANGELOG y los commits van en
  **español**. En la interfaz se trata al usuario de **usted**.
- **Componentes:** `OnPush`, `input()`/`output()`, `inject()`, `@if`/`@for`, `styleUrl`.
- **Commits:** Conventional Commits con descripción en español, por ejemplo
  `fix: tolerar espacios en el grep de version.json`.
- **Ramas:** `feature/**`, `bugfix/**` y `hotfix/**`. La CI (`.github/workflows/ci.yml`) corre en
  cada push a esas ramas, no en PR. La estrategia de ramas y versionado está en
  `docurural-backend/docs/ci-cd.md`.

## §UI

- **El cuerpo de texto nunca baja de 16 px (`--text-base`).** Es un requisito de accesibilidad. Los
  tokens menores (`--text-2xs` a `--text-md`) son solo para captions, badges y etiquetas.
- Colores, tamaños de letra, espaciados y radios salen **solo** de los tokens de
  `src/styles/_tokens.scss`. Si falta un valor, se añade un token siguiendo `src/styles/README.md`.
- Media queries solo con los mixins `bp.lg`, `bp.md` y `bp.sm` (`src/styles/_breakpoints.scss`).
- Botones con `<app-button>` / `<app-icon-button>`. Feedback al usuario con `NotificationService`
  (toasts) o `<app-alert>` (errores inline en diálogos).

## No hacer

- No añadir otra librería de UI ni de estado.
- No acceder a `localStorage` fuera de `AuthStorageService`.
- No usar `any`, `console.*` ni `@Input`/`@Output` con decorador.
- No escribir colores ni px literales en SCSS de componente.
- No bajar el umbral de cobertura ni subir los presupuestos de `angular.json` para silenciar avisos.
- No hacer commit ni push sin que se pida explícitamente.
