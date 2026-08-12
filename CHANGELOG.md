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
