# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Añadido pipeline de CI/CD con GitHub Actions: workflow de integración continua
  (`ci.yml`), workflow reutilizable de despliegue (`_deploy.yml`), despliegues a
  Desarrollo/QA/Producción (`cd-dev.yml`, `cd-qa.yml`, `cd-prod.yml`) y back-merge
  automático de ramas de release/hotfix hacia `develop` (`release-backmerge.yml`),
  replicando el patrón ya usado en `docurural-backend`.
- Añadida la auditoría de consistencia arquitectónica, el plan de remediación y el borrador de
  reglas del proyecto para Spec Kit (`docs/`).
- Añadido ESLint (`angular-eslint` 21) con el script `npm run lint`. Las reglas que el código aún
  no cumple quedan como aviso hasta su fase de remediación.
- Añadido `scripts/check-styles.mjs` (`npm run check:styles`) para verificar el uso de tokens de
  diseño y breakpoints. De momento solo informa.
- Añadido `CLAUDE.md` con los comandos, la arquitectura, las convenciones y la sección §UI.
- Añadida la red de seguridad de tests (fase 1 de la remediación): 105 tests unitarios nuevos
  sobre servicios, interceptor, guards, utilidades, validadores y la regla de sensibilidad de los
  diálogos de documentos. Los riesgos conocidos R2, R3, R4 y R7 quedan documentados como fallos
  esperados.
- Añadidos umbrales de cobertura en `npm run test:ci` (`vitest-base.config.ts`): `core/` ≥ 80 %
  de líneas y una línea base global que solo puede subir.
- Añadidos E2E de humo con Playwright (`npm run e2e`) con la API simulada: login, dashboard,
  búsqueda, paginación, detalle y validación del diálogo de subida, más capturas de referencia de
  6 páginas a 1280 px y 600 px.
- Añadido `.gitattributes` para mantener finales de línea LF en todas las plataformas.

### Changed

- La CI ejecuta ESLint y `check:styles` después de Prettier.
- La CI ejecuta los E2E de flujos (`npm run e2e:ci`) en un job paralelo. Las capturas de
  referencia se mantienen solo en local.
- El README documenta cómo ejecutar los tests unitarios y E2E (sección "Tests").
- El README documenta los cuatro entornos y el disparador real de la CI (push a ramas de trabajo,
  no en PR).
- Convenciones y limpieza (fase 2 de la remediación):
  - Imports entre `core/`, `shared/`, `features/` y `environments/` con los alias `@core/*`,
    `@shared/*`, `@features/*` y `@env/*`.
  - Los modelos usan el sufijo `.model.ts`.
  - Los componentes de búsqueda y filtros de documentos usan `input()` y `output()`. Sus outputs
    `submit`, `reset` y `close` pasan a llamarse `searchSubmit`, `resetFilters` y `closePanel`.
  - `track x.id` en lugar de métodos `trackById`, `[class]` en lugar de `NgClass`, `styleUrl` en
    lugar de estilos inline y sin `standalone: true` redundante.
  - Los textos de los diálogos de usuarios tratan al usuario de usted.
  - Las etiquetas visuales de los `mat-select` son `<span>` con `id` en lugar de `<label>` sin
    control asociado.
  - ESLint pasa a `error` las reglas que el código ya cumple: signals en inputs y outputs, outputs
    sin nombre de evento DOM, `NgClass`, estilos inline, `standalone`, imports relativos de más de
    dos niveles y `<label>` sin control.

### Removed

- Eliminado código sin uso: `ConfirmDialogComponent`, `SensitivityReadonlyFieldComponent`, el
  barril `shared/sensitivity/index.ts`, `DocumentStatus`, los mixins de `src/styles/_utils.scss`,
  las inyecciones de `MAT_DIALOG_DATA` sin uso de los diálogos de subida y el `BreakpointObserver`
  de `NotificationService`.
