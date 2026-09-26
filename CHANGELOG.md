# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added

- Añadido el **permiso para aprobar documentos** (HU-32): la casilla "Puede aprobar documentos" en
  los formularios de crear y editar usuario, con una ayuda según el rol. Se bloquea para los
  lectores y en la autoedición (el formulario no envía el propio permiso). Al cambiar a Lector a un
  aprobador, avisa antes de guardar, recupera el valor si se vuelve a otro rol y confirma la
  retirada en el toast.
- Añadida la etiqueta "Aprobador" en el listado de usuarios (tabla y tarjetas), atenuada y
  explicada para lectores de pantalla si el usuario está inactivo.
- Añadida una nota sobre la aprobación en la confirmación de activar y desactivar a un aprobador.
- Añadida la variante `accent` de `<app-badge>` y la utilidad global `.visually-hidden`
  (`src/styles/_a11y.scss`).

### Changed

- Un 400 sin errores de campo al guardar un usuario muestra el mensaje del backend en lugar del
  genérico.
- El formulario de usuario usa la estructura de diálogo con scroll (`.dialog-form` y
  `.dialog-fields`): en móvil los campos se desplazan y los botones quedan siempre visibles.

## [1.0.1] - 2026-09-23

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
- Estructura y utilidades compartidas (fase 3 de la remediación):
  - Los contratos de los diálogos de usuarios viven en su diálogo, y el modelo de filtros de
    documentos en la feature de documentos.
  - El icono de formato, el pill de categoría (`app-category-pill`) y las utilidades de
    descarga, tamaño, fechas y formato pasan a `shared/`. Los diálogos de subida y edición de
    documentos pasan a `features/documents/dialogs/`, su superficie pública.
  - Una sola implementación de iniciales, colores por nombre, `inferFormat` y conversión de
    fechas `YYYY-MM-DD` en `shared/utils/`.
  - Fechas con el pipe `date` y `LOCALE_ID` `es-CO`, formatos de datepicker registrados una vez,
    tamaños de diálogo con nombre (`shared/ui/dialog-sizes.ts`) y permisos por rol centralizados
    en `core/auth/permissions.ts`.
  - ESLint pasa a `error` los imports entre features y la cobertura exige ≥ 80 % de líneas en
    `shared/utils/`.
- Estilos y sistema de diseño (fase 4 de la remediación):
  - Los SCSS de componente y el TypeScript usan solo tokens de color, tipografía, espaciado y
    radio. Hay tokens nuevos (familias de color `purple` y `teal`, medios pasos de espaciado y
    radios `xs` y `circle`) y un mixin `icon.size()` para los iconos. `npm run check:styles` es
    estricto y hace fallar la CI.
  - Media queries con los mixins de breakpoints y `BreakpointObserver` en lugar de
    `window.innerWidth`.
  - Los botones propios del dashboard, del panel de filtros y de los estados vacíos usan
    `<app-button>`.
  - El snackbar y el toast se cargan con el primer aviso: el bundle inicial baja de 527 kB a
    406 kB.
- Capa HTTP, errores y formularios (fase 5 de la remediación):
  - Una sola política de errores HTTP: `NotificationService.httpError` y `shared/http/api-error.ts`.
    Los errores de carga ya no tapan el toast «Sesión expirada» (R1).
  - `DocumentDownloadService`: la misma descarga, con spinner y toasts, en el listado, el detalle
    y los recientes del dashboard.
  - Si falla la carga del dashboard, se muestran un toast y un estado vacío con «Reintentar».
  - Formularios con `fb.nonNullable`, límites como constantes, mensajes de error con
    `<app-field-error>` y `*.messages.ts`, y la longitud mínima del nombre de usuario sobre el
    valor recortado.
  - Los diálogos de documentos comparten la sincronización de la sensibilidad con la categoría y
    la carga de categorías activas.
  - ESLint pasa a `error` la restricción de `FormsModule`.
- Ruteo y autorización (fase 6 de la remediación):
  - Página 404 propia para las direcciones que no existen, en lugar de redirigir al login.
  - Los títulos de los documentos (listado y recientes del dashboard), «Ver documento» y
    «Volver» son enlaces: un documento se puede abrir en otra pestaña. `<app-button>` y
    `<app-icon-button>` aceptan `link`.
  - La acción rápida «Subir documento» ya no añade `?action=upload`, que no tenía efecto.
- Estado, suscripciones y detección de cambios (fase 7 de la remediación):
  - Todas las suscripciones de componentes se cancelan al destruirse (`takeUntilDestroyed`), y
    ESLint lo exige en `features/` y `shared/`.
  - Todos los componentes usan `OnPush`; la regla de ESLint pasa a `error`.
  - La carga inicial de Usuarios, Categorías y el detalle de documento se hace en `ngOnInit`.
- Internacionalización (fase 8 de la remediación):
  - La interfaz está disponible en español y en inglés con `@angular/localize`: un build por
    idioma, servido en `/es/` y `/en/`. La raíz redirige según el idioma del navegador.
  - Enlace para cambiar de idioma en el login y en el menú lateral.
  - Las fechas siguen el formato de cada idioma.
  - Los mensajes que son oraciones completas terminan en punto, y se corrigen «Se encontró 1
    documento» y el trato de usted en la pista de la contraseña.
  - ESLint exige `i18n` en todo texto de las plantillas y el build falla si falta una traducción.
  - El health check del despliegue comprueba los dos idiomas.

### Removed

- Eliminado código sin uso: `ConfirmDialogComponent`, `SensitivityReadonlyFieldComponent`, el
  barril `shared/sensitivity/index.ts`, `DocumentStatus`, los mixins de `src/styles/_utils.scss`,
  las inyecciones de `MAT_DIALOG_DATA` sin uso de los diálogos de subida y el `BreakpointObserver`
  de `NotificationService`.

### Fixed

- Al paginar, ordenar o buscar rápido en Documentos (y al cambiar de orden en Usuarios y
  Categorías), una respuesta antigua que llega tarde ya no reemplaza a la última (R2).
- Salir del detalle de un documento antes de que cargue la vista previa ya no deja el archivo
  retenido en memoria (R3).
- La sesión se cierra al vencer el token, sin esperar a un error del servidor, y se comprueba en
  cada navegación entre páginas (R4).
- Al iniciar sesión desde un enlace con varios parámetros, se vuelve a la dirección completa (R7).
- El permiso para editar un documento se decide por id de usuario y no por nombre (R5).
- Los errores de campo del backend (400 con `fieldErrors`) y el de duplicado (409) se muestran
  junto a cada campo: al rehabilitar el formulario se borraban (R12). En el login se ven aunque
  se envíe con Enter sin salir del campo (R9).
- A 1280 px con el menú lateral, el dashboard ya no corta la quinta tarjeta de accesos rápidos
  ni solapa columnas en la tabla de recientes, y Categorías ya no corta la columna de acciones.
- El botón «Limpiar búsqueda y filtros» del estado vacío de resultados tiene estilo (R8).
- En el detalle de un documento en móvil, los botones de la cabecera ocupan todo el ancho.
- La fecha de los documentos ya no se muestra un día antes en Colombia (R11): las fechas
  `YYYY-MM-DD` se interpretan como fecha local en el listado, el detalle y el diálogo de edición.
