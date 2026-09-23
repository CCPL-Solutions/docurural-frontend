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

### Changed

- La CI ejecuta ESLint y `check:styles` después de Prettier.
- El README documenta los cuatro entornos y el disparador real de la CI (push a ramas de trabajo,
  no en PR).
