# Constitución de docurural-frontend

Frontend Angular de DocuRural, la gestión documental de la IERD Miña y Ticha. Consume la API de
`docurural-backend`. Las palabras **DEBE**, **NO DEBE** y **PUEDE** tienen sentido normativo. Cada
regla conserva su ID y su forma de verificación; las reglas automatizables las hace cumplir la CI.

## Principios fundamentales

### I. Arquitectura por capas y límites entre features

`src/app/` se divide en `core/` (transversal y singleton), `features/` (una carpeta por feature) y
`shared/` (reutilizable, sin lógica de negocio).

- **ARQ-01** — `core/` DEBE contener solo lo transversal. Un modelo o tipo que usa una sola
  feature vive dentro de esa feature. _Verificación: revisión._
- **ARQ-02** — Una feature NO DEBE importar archivos internos de otra. Lo compartido vive en
  `shared/` y, si es lógica de negocio, en `features/<feature>/dialogs/` como superficie
  pública. _Verificación: ESLint `no-restricted-imports`._
- **ARQ-03** — Los tipos `XxxDialogData` y `XxxDialogResult` DEBEN declararse en el archivo del
  componente de diálogo. _Verificación: grep `DialogData` en `core/` = 0._
- **ARQ-04** — Los archivos de modelo DEBEN usar el sufijo `.model.ts`.
- **ARQ-05** — Los imports entre carpetas raíz DEBEN usar los alias `@core/*`, `@shared/*`,
  `@features/*` y `@env/*`. Los relativos solo se usan dentro de la misma feature o componente y
  NO DEBEN superar dos niveles (`../../`). _Verificación: ESLint (patrón `(\.\./){3,}`)._
- **ARQ-06** — El HTTP DEBE vivir solo en `core/services/`, con un servicio por recurso y URLs
  construidas con `environment.apiBaseUrl`.
- **CAL-04** — Cada utilidad (iniciales, color por nombre, parseo de fechas, formato de archivo,
  descarga) DEBE tener una sola implementación, en `shared/utils/`.

_Razón:_ los límites explícitos evitan el acoplamiento entre features que la auditoría detectó y
permiten que ESLint los vigile.

### II. Componentes standalone, OnPush y basados en signals

- **CMP-01** — Todo componente DEBE declarar `ChangeDetectionStrategy.OnPush` (la app es
  zoneless). _Verificación: ESLint `prefer-on-push-component-change-detection`._
- **CMP-02** — Inputs y outputs DEBEN declararse con `input()`, `input.required()` y
  `output()`. Se prohíben `@Input` y `@Output`. _Verificación: ESLint._
- **CMP-03** — Ningún output DEBE llamarse como un evento DOM nativo (`submit`, `close`,
  `reset`, `click`…). _Verificación: ESLint `no-output-native`._
- **CMP-04** — La carga inicial de datos DEBE lanzarse en `ngOnInit`, nunca en el constructor.
- **CMP-05** — Todo `@for` DEBE usar `track` con la identidad inline (`track x.id`). Se prohíben
  los métodos `trackBy`.
- **CMP-06** — Las clases dinámicas DEBEN enlazarse con `[class]` o `[class.x]`. Se prohíbe
  `NgClass`. _Verificación: ESLint._
- **CMP-07** — Los estilos de componente DEBEN ir en `styleUrl`. Se prohíbe `styles: [...]`.
- **CMP-08** — La plantilla PUEDE ir inline solo si el componente es presentacional y la
  plantilla tiene ≤ 40 líneas. En otro caso, `templateUrl`.
- **CMP-09** — Los componentes son standalone por defecto: NO DEBE declararse
  `standalone: true` ni usarse NgModules. _Verificación: ESLint._
- **CMP-10** — Las dependencias DEBEN inyectarse con `inject()`, no por constructor.
- **CMP-11** — El control de flujo DEBE usar `@if`, `@for` y `@switch`. Se prohíben `*ngIf`,
  `*ngFor` y demás directivas estructurales equivalentes.
- **CMP-12** — Todo selector de componente DEBE llevar el prefijo `app-`.

_Razón:_ un único estilo de componente, el idiomático de Angular 21, hace el código predecible y
es requisito para la detección de cambios zoneless.

### III. Estado con signals y flujo de datos cancelable

- **EST-01** — Los datos DEBEN obtenerse con servicio → `subscribe` → `signal.set`.
  `httpResource`/`rxResource` NO DEBEN adoptarse hasta reevaluarlo con Angular 22.
- **EST-02** — Toda suscripción dentro de un componente DEBE usar
  `takeUntilDestroyed(this.destroyRef)`. _Verificación: ESLint `no-restricted-syntax`._
- **EST-03** — Las recargas repetibles (paginación, orden, búsqueda, filtros) DEBEN encadenarse
  con un `Subject` + `switchMap` para descartar respuestas obsoletas. _Verificación: test de
  respuestas fuera de orden._
- **EST-04** — Todo recurso creado con `URL.createObjectURL` DEBE revocarse, también si el
  componente se destruye antes de recibir la respuesta. _Verificación: test._
- **EST-05** — `effect()` solo DEBE usarse como puente con APIs imperativas (FormControl, DOM,
  librerías de terceros). NO DEBE escribir en signals para derivar estado: para eso están
  `computed()` y `linkedSignal()`.
- El estado es de signals. La sesión (`AuthService`) es el único estado global.

_Razón:_ corrige las condiciones de carrera (R2) y las fugas de memoria (R3) de la auditoría sin
introducir una librería de estado.

### IV. Capa de datos y errores HTTP centralizados

- **API-01** — El cuerpo de un error HTTP DEBE leerse solo con `toApiError()`/`readApiError()`
  (`shared/http/`). Se prohíbe `err.error`. _Verificación: grep `err\.error` en `features/` = 0._
- **API-02** — El 401 lo DEBE gestionar exclusivamente el interceptor. Ningún componente
  notifica ni ramifica por un 401, salvo el login, donde significa credenciales incorrectas. Los
  errores se notifican con `notifications.httpError(err, título, alternativo)`.
- **API-03** — Los `fieldErrors` del backend DEBEN aplicarse con `applyFieldErrors()`, que marca
  el control como `touched`.
- **API-04** — Un error al cargar una página DEBE comunicarse con un toast más
  `app-empty-state`. No hay bloques de error inline en páginas (en diálogos, `<app-alert>`).
- **API-05** — Toda descarga de documento DEBE pasar por `DocumentDownloadService` (spinner por
  elemento, toast de éxito y de error).
- **API-06** — Las señales de carga DEBEN llamarse `loading` o `loadingXxx`.
- **API-07** — Los cuerpos de las peticiones DEBEN tiparse (parámetro tipado o
  `satisfies XxxRequest`).
- **API-08** — `NotificationService` DEBE ser el único mecanismo de toasts.

_Razón:_ un único camino para errores y descargas elimina los avisos duplicados del 401 (R1) y la
pérdida de errores del backend (R9, R12).

### V. Ruteo, navegación y autorización

- **RUT-01** — La navegación que no depende de lógica previa DEBE usar `routerLink` (en botones,
  `<app-button link>` / `<app-icon-button link>`). `router.navigate` solo se usa tras una lógica
  (guardar, validar, cerrar sesión).
- **RUT-02** — Los permisos por rol DEBEN consultarse solo con las funciones de
  `core/auth/permissions.ts`. Se prohíbe comparar `role === '…'` fuera de ese archivo.
- **RUT-03** — Los permisos sobre un recurso DEBEN comparar ids de usuario, nunca nombres.
  _Verificación: test de `canEditDocument`._
- **RUT-04** — Toda ruta desconocida (`**`) DEBE mostrar la página 404 propia.
- **RUT-05** — Todo query param que la app escribe DEBE tener un consumidor.
- **RUT-06** — Todas las rutas DEBEN ser lazy (`loadComponent`) y tener `title`.
- **RUT-07** — Guards e interceptores DEBEN ser funcionales.
- **RUT-08** — La sesión DEBE validarse en cada navegación (`canActivateChild`) y caducar con
  `expiresAt`.

_Razón:_ la autorización por nombre o por literales de rol fue un riesgo de seguridad detectado
(R4); centralizarla la hace comprobable con tests.

### VI. Formularios y validación

- **FRM-01** — Los formularios DEBEN ser Reactive Forms con `NonNullableFormBuilder`
  (`fb.nonNullable`). Se prohíben los casts en valores iniciales (`'' as string | null`). Signal
  Forms se reevalúan con Angular 22.
- **FRM-02** — Los límites de validación compartidos con el backend DEBEN ser constantes
  (`MAX_*`, `MIN_*`) junto a su modelo, también en contadores y `maxlength` de plantillas. Se
  prohíben los literales en `Validators.maxLength`/`minLength`.
- **FRM-03** — Los errores de campo DEBEN mostrarse con `<app-field-error>` y un `*.messages.ts`
  por feature. Se prohíben los métodos `xxxError()` por componente.
- **FRM-04** — Las longitudes mínimas de texto DEBEN validarse sobre el valor recortado
  (`trimmedMinLength`).
- **FRM-05** — Los campos sueltos fuera de un formulario DEBEN enlazarse con `(input)` más un
  signal. Se prohíben `ngModel` y `FormsModule`. _Verificación: ESLint._
- **FRM-06** — Los formatos de los datepickers DEBEN proveerse una única vez, en `app.config.ts`
  (`provideNativeDateAdapter(APP_DATE_FORMATS)`). Ningún componente provee `MAT_DATE_FORMATS`.

_Razón:_ validaciones alineadas con el backend y mensajes centralizados evitan divergencias y
dejan los textos listos para traducir.

### VII. Sistema de diseño y accesibilidad

- **UI-01** — Los colores DEBEN expresarse solo con tokens `var(--color-*)` de
  `src/styles/_tokens.scss`. Se prohíben hex y `rgb()` en SCSS de componente y en TS; lo que
  dibuja en canvas lee los tokens resueltos con `getComputedStyle`.
- **UI-02** — Un color nuevo DEBE añadirse primero como token, siguiendo `src/styles/README.md`.
- **UI-03** — Las media queries DEBEN escribirse solo con los mixins `bp.lg`/`bp.md`/`bp.sm`. En
  TS, `BreakpointObserver` con `shared/ui/breakpoints.ts`. Se prohíbe `window.innerWidth`.
- **UI-04** — Los parciales SCSS DEBEN importarse por nombre (`@use 'breakpoints'`), nunca por
  ruta relativa.
- **UI-05** — Los botones de acción DEBEN usar `<app-button>` (con texto) o `<app-icon-button>`
  (solo icono). Se prohíben botones nativos que reimplementen variantes del botón.
- **UI-06** — Las confirmaciones DEBEN ser diálogos a medida sobre `_confirmation-dialog.scss`.
  NO DEBE existir un diálogo de confirmación genérico.
- **UI-07** — Los tamaños de diálogo DEBEN tomarse de `shared/ui/dialog-sizes.ts`.
- **UI-08** — El cuerpo de texto NO DEBE bajar de `--text-base` (16 px). Los tokens menores son
  solo para captions, badges y etiquetas. _Verificación: revisión visual (pendiente de
  auditoría)._
- **UI-09** — Tamaños de letra, espaciado y radios DEBEN expresarse solo con tokens (`--text-*`,
  `--space-*`, `--radius-*`). Excepciones: `0`, `1px` en espaciado y los tamaños de icono, que
  se escriben con `icon.size(Npx)` (`src/styles/_icons.scss`).
- **UI-10** — Todo `<label>` DEBE estar asociado a un control. Las etiquetas visuales asociadas
  vía `aria-labelledby` usan `<span>` o `<div>` con `id`. _Verificación: ESLint
  `template/label-has-associated-control`._

_Verificación general:_ `npm run check:styles` hace fallar la CI ante literales de color, tamaño,
espaciado, radio o media queries. _Razón:_ un único sistema de tokens garantiza coherencia visual
y accesibilidad para usuarios de zonas rurales con dispositivos y vista diversos.

### VIII. Idioma, internacionalización y tipado

- **CAL-11** — Todo el código (clases, métodos, variables, archivos, carpetas, rutas y clases
  CSS) DEBE usar identificadores en inglés.
- **CAL-13** — Los comentarios de código DEBEN escribirse en español.
- **CAL-05** — Los commits DEBEN seguir Conventional Commits con descripción en español. El
  CHANGELOG, la documentación y esta constitución se escriben en español.
- **CAL-01** — Los textos de la interfaz DEBEN tratar al usuario de **usted**. Las oraciones
  completas (toasts, errores, validaciones, pistas) terminan en punto; títulos, etiquetas,
  botones, placeholders y tooltips, no.
- **CAL-02** — Todo texto visible DEBE marcarse con `@angular/localize`: `i18n="@@id"` (o
  `i18n-<atributo>`) en plantillas y `` $localize`:@@id:Texto` `` en TypeScript, con IDs en
  inglés (`@@<ámbito>.<pantalla>.<clave>`) y recuentos con ICU `plural`. No hay texto en
  ternarios de bindings. No se traducen nombres propios, valores que se guardan en el backend ni
  mensajes del backend. Idiomas: `es-CO` (origen) y `en`, un build por idioma. _Verificación:
  ESLint `template/i18n`, `ng extract-i18n` sin avisos y build con
  `i18nMissingTranslation: error`._
- **CAL-03** — Fechas y números DEBEN formatearse con los pipes de Angular (o `formatDate`)
  según `LOCALE_ID` y los formatos de `shared/utils/date-formats.ts`. Se prohíbe
  `new Intl.*Format` con un locale fijo.
- **CAL-12** — `strict` y `strictTemplates` DEBEN estar activos. Se prohíbe `any`.
- **CAL-14** — Las formas de datos DEBEN declararse con `interface`, y las uniones, con `type`.

_Razón:_ la separación inglés (código) / español (personas) y la i18n con IDs estables permiten
un segundo idioma sin tocar la lógica, y corrigen el desfase de fechas (R11).

## Restricciones técnicas

- **Stack:** Angular 21 (standalone, zoneless, signals), Angular Material 21, RxJS 7.8,
  TypeScript 5.9 en modo `strict`, Vitest (`@angular/build:unit-test`), Playwright para E2E,
  angular-eslint 21 y Prettier.
- NO DEBE añadirse otra librería de UI ni de estado.
- `localStorage` NO DEBE usarse fuera de `AuthStorageService`.
- Se prohíbe `console.*` en el código de la aplicación.
- NO DEBEN bajarse los umbrales de cobertura ni subirse los presupuestos de `angular.json` para
  silenciar avisos.
- **Decisiones aplazadas** (se reevalúan al subir a Angular 22, no antes): Signal Forms,
  `httpResource`/`rxResource`. Tampoco se introducen mappers DTO → dominio mientras el backend
  sea propio y no haya transformaciones.

## Flujo de trabajo y puertas de calidad

- **CAL-06** — `npm run lint` DEBE pasar sin errores ni avisos. Toda regla automatizable de esta
  constitución DEBE verificarse con ESLint o con `check:styles`.
- **CAL-07** — Servicios, guards, interceptores, validadores y utilidades DEBEN tener spec, junto
  al archivo (`*.spec.ts`, patrón zoneless _act → `await fixture.whenStable()` → assert_).
  Cobertura mínima de líneas: 80 % en `core/` y `shared/utils/`, 70 % global. El umbral de
  `vitest-base.config.ts` solo puede subir (trinquete) hasta alcanzar el objetivo. Un bug
  conocido se documenta con `it.fails`/`test.fail()` y un comentario con su riesgo y la fase que
  lo corrige.
- **CAL-08** — Los flujos críticos (login, listado con búsqueda, detalle, subida) DEBEN tener un
  E2E de humo con la API simulada. Las capturas de referencia son locales (Windows); un cambio
  visual intencionado las actualiza con `npm run e2e -- --update-snapshots`.
- **CAL-09** — La CI (`.github/workflows/ci.yml`) DEBE ejecutarse en `push` a `feature/**`,
  `bugfix/**` y `hotfix/**`, no en PR, con Prettier, ESLint, `check:styles`, tests con umbral de
  cobertura, build de producción y E2E de flujos.
- **CAL-10** — DEBE existir un `CLAUDE.md` en la raíz, actualizado, que remita a esta
  constitución y contenga la sección §UI.
- **Definición de terminado:** un cambio no está terminado hasta que `npm run lint`,
  `npm run test:ci`, `npm run build` y `npm run format:check` están en verde; si toca textos,
  además `npm run extract-i18n` y `src/locale/messages.en.xlf` actualizados.
- **Ramas:** `feature/**`, `bugfix/**` y `hotfix/**`, según `docurural-backend/docs/ci-cd.md`.
  Un trabajo por fases usa una rama por fase desde `develop` actualizado y un PR hacia `develop`
  que se fusiona antes de empezar la fase siguiente.

## Gobernanza

- Esta constitución prevalece sobre cualquier otra práctica del repositorio. `CLAUDE.md` y el
  README la resumen y NO DEBEN contradecirla; si difieren, manda la constitución y se corrige el
  resumen.
- **Enmiendas:** se proponen por PR hacia `develop` que modifique este archivo, con la regla
  nueva o cambiada, su ID, su verificación y su justificación (decisión o riesgo que la origina).
  Una regla nueva que el código aún no cumple DEBE ir acompañada de la fase o tarea que la hará
  cumplir. Al fusionarse se actualizan `CLAUDE.md` y, si aplica, las reglas de ESLint o de
  `check:styles`.
- **Versionado semántico:** MAJOR si se elimina o redefine una regla de forma incompatible;
  MINOR si se añade una regla o sección o se amplía materialmente; PATCH para aclaraciones y
  redacción. La fecha de última enmienda se actualiza con cada cambio.
- **Cumplimiento:** toda revisión de PR y todo plan de Spec Kit (`/speckit-plan`, apartado
  _Constitution Check_) DEBEN comprobar estas reglas. Una excepción DEBE justificarse por
  escrito en el PR o en el plan, con su alcance y cuándo se retira. Las reglas con
  incumplimiento conocido se registran como deuda con la fase que las corrige; no se copia un
  patrón existente sin comprobar la regla.
- Para la guía de desarrollo en tiempo de ejecución se usa `CLAUDE.md` y la skill
  `angular-developer`.

**Versión**: 1.0.0 | **Ratificada**: 2026-09-23 | **Última enmienda**: 2026-09-23
