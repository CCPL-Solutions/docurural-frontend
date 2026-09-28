---

description: "Tareas de implementación de la HU-31 (configuración de aprobación por categoría)"
---

# Tasks: Configuración de aprobación por categoría (HU-31)

**Input**: documentos de diseño en `specs/002-category-approval-config/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/categories-api.md,
quickstart.md

**Tests**: incluidos. La constitución (CAL-07, CAL-08) exige specs junto al archivo y E2E de los
flujos, y el plan los detalla en research R11. Patrón zoneless: _act → `await fixture.whenStable()`
→ assert_.

**Organization**: tareas agrupadas por historia de usuario (US1–US4 de spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1…US4)
- Rutas relativas a la raíz del repositorio

## Reglas que aplican a todas las tareas

- Textos de interfaz en español, tratando de usted, con `i18n="@@id"` o
  `` $localize`:@@id:Texto` `` y los IDs de la tabla siguiente. Oraciones con punto final; títulos,
  etiquetas y valores sin él (CAL-01, CAL-02).
- Colores, tamaños, espaciados y radios solo con tokens de `src/styles/_tokens.scss`; media
  queries con `bp.*`; iconos con `icon.size(Npx)` (UI-01, UI-09).
- Ninguna comparación de rol fuera de `src/app/core/auth/permissions.ts` (RUT-02).
- Los textos `approvalScopeNotice` y `approverWarning` de la respuesta del backend NO se leen
  (research R2).

### IDs de i18n

| ID | Texto (es) |
|----|------------|
| `@@categories.field.requiresApproval` | Requiere aprobación |
| `@@categories.form.approval.hint` | Los documentos de esta categoría pasarán por el flujo de aprobación. |
| `@@categories.form.approval.fewApprovers` | Hay menos de dos usuarios con permiso de aprobar. Los documentos que cargue un aprobador no podrán ser aprobados por él mismo. |
| `@@categories.approval.yes` | Sí |
| `@@categories.approval.no` | No |
| `@@categories.approval.cardYes` | Aprobación: Sí |
| `@@categories.approval.cardNo` | Aprobación: No |
| `@@categories.toast.approvalOn.title` | Aprobación activada |
| `@@categories.toast.approvalOff.title` | Aprobación desactivada |
| `@@categories.toast.approvalScope.description` | Este cambio solo afecta a los documentos que se carguen desde ahora. Los documentos existentes conservan su estado actual. |

---

## Phase 1: Setup

**Purpose**: comprobar lo que el plan dejó pendiente

- [X] T001 Revisar en `node_modules/@angular/material/slide-toggle/_m3-slide-toggle.scss` (o `fesm2022/slide-toggle.mjs`) las variables `--mat-slide-toggle-*` de colores (pista y manija, seleccionado y sin seleccionar, deshabilitado, foco) y de tamaño (alto/ancho de la pista, tamaño de la manija), y anotar en este archivo cuáles se usarán en T007 y si el tamaño del diseño (40 × 22) se puede lograr con tokens `--space-*` (research R7). **Resultado:** colores con `--mat-slide-toggle-{selected,unselected}-{track,handle}-color`, `--mat-slide-toggle-{selected,unselected}-{hover,focus,pressed}-{track,handle}-color`, `--mat-slide-toggle-disabled-*` y `--mat-slide-toggle-track-outline-{color,width}`; tamaño con `--mat-slide-toggle-track-{width,height}`, `--mat-slide-toggle-{selected,unselected,pressed}-handle-size` y los `*-handle-horizontal-margin` (la manija se sitúa con su margen izquierdo). No hay token de 22 px: se usa pista `--space-8` × `--space-6` (40 × 24) y manija `--space-5` (20), con márgenes `--space-0-5` (apagado) y `calc(var(--space-8) - var(--space-5) - var(--space-0-5))` (encendido)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tipos, compilación de los fixtures y campo "Requiere aprobación" del formulario, que
necesitan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

- [X] T002 [P] Añadir `requiresApproval: boolean` a la interfaz `Category` en `src/app/core/models/category.model.ts`, con comentario en español ("Requiere aprobación (HU-31). Siempre presente en las respuestas; `false` en las categorías anteriores a la HU")
- [X] T003 [P] En `src/app/core/models/category-list.model.ts`, añadir `requiresApproval: boolean` (obligatorio, "el frontend lo envía siempre", research R1) a `CreateCategoryRequest` y `UpdateCategoryRequest`, y `requiresApproval: boolean` a `CreateCategoryResponse` y `UpdateCategoryResponse`. NO declarar `approvalScopeNotice` ni `approverWarning` (research R2)
- [X] T004 Actualizar los objetos de categoría de prueba para que compilen con el campo nuevo (`requiresApproval: false` salvo que el caso diga otra cosa) en `src/app/core/services/api-services.spec.ts`, `src/app/features/categories/category-list/category-list.component.spec.ts`, `src/app/features/categories/category-list/components/category-toggle-status-dialog/category-toggle-status-dialog.component.spec.ts`, `src/app/features/documents/document-list/components/sensitivity-dialogs.spec.ts` y cualquier otro que construya un `Category` (buscar `defaultSensitivityLevel:` en `src/app/**/*.spec.ts`); añadir `requiresApproval` a cada categoría de `CATEGORIES` en `e2e/support/fixtures.ts` (`true` en "Actas", `false` en el resto). Depende de T002 y T003
- [X] T005 Andamiaje del control en `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.ts`: añadir `requiresApproval: [false]` al grupo `fb.nonNullable` (en No por defecto, FR-001); exponer `requiresApprovalValue = toSignal(this.form.controls.requiresApproval.valueChanges, { initialValue: this.form.controls.requiresApproval.value })`; en `ngOnInit`, en edición, incluir `requiresApproval: this.data.category.requiresApproval` en el `patchValue`; guardar `originalRequiresApproval` (`this.data.category?.requiresApproval ?? false`) como propiedad de solo lectura; incluir `requiresApproval: raw.requiresApproval` en el `payload` de `executeSubmit` (siempre, en creación y edición, FR-007); y en `handleSuccess`, añadir `requiresApproval: res.requiresApproval` al `Category` actualizado. Importar `MatSlideToggleModule`. Depende de T003
- [X] T006 Campo en `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.html`, al final de `dialog-fields`, después del bloque de sensibilidad (FR-001, artboard `hu28b-create-internal`): contenedor `<div class="field approval-field">` separado por un borde superior; a la izquierda un `<span class="approval-field__label" id="requiresApproval-label">` con el icono `approval` (`aria-hidden="true"`) y el texto `@@categories.field.requiresApproval`, y debajo `<span class="approval-field__hint" id="requiresApproval-hint">` con `@@categories.form.approval.hint`; a la derecha el texto "Sí"/"No" (`@@categories.approval.yes`/`@@categories.approval.no`, con `aria-hidden="true"`, según `requiresApprovalValue()`) y `<mat-slide-toggle class="app-switch" formControlName="requiresApproval" hideIcon aria-labelledby="requiresApproval-label" aria-describedby="requiresApproval-hint">` (FR-013; UI-10: nada de `<label>` sin control). Dejar un hueco debajo para la advertencia de US3. Depende de T005
- [X] T007 [P] Estilos: en `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.scss`, bloque `.approval-field` (fila con etiqueta y ayuda a la izquierda e interruptor a la derecha, `gap` y margen con `--space-*`, `border-top: 1px solid var(--color-divider)` o el token de separador existente); etiqueta con `--text-base` y peso 500; ayuda con `--text-base` y `--color-text-secondary` (UI-08: NO reutilizar `field__hint` ni `level-banner__text`); texto "Sí" con `--color-primary-dark` y "No" con `--color-text-secondary`. En `src/styles/_material-overrides.scss`, clase `.app-switch` que apunta las variables `--mat-slide-toggle-*` anotadas en T001 a tokens (seleccionado → `--color-primary`, sin seleccionar → `--color-border-strong` o el gris de token más cercano, manija → `--color-bg-card`) y, si T001 lo permitió, el tamaño. `npm run check:styles` en verde. Depende de T001
- [X] T008 Crear `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.spec.ts` con el arnés: `TestBed` con `MAT_DIALOG_DATA` configurable (creación / edición de una categoría con `requiresApproval` `true` o `false`), `MatDialogRef` simulado (`close`, `disableClose`), `CategoriesService` simulado (`create`, `update` con `of(...)` o `throwError`), `UsersService` simulado (`list`, por defecto `of({ totalUsers: 0, users: [] })`), `NotificationService` simulado (`success`, `info`) y helpers para rellenar un nombre válido y alternar el interruptor. Primeros casos: (a) el formulario tiene el control `requiresApproval` y se renderiza el interruptor con la etiqueta "Requiere aprobación" y la ayuda; (b) accesibilidad (FR-013): el elemento con `role="switch"` tiene `aria-checked` igual al valor del control, `aria-labelledby` apunta al elemento con el texto "Requiere aprobación" y `aria-describedby` al de la ayuda; el texto visible "Sí"/"No" tiene `aria-hidden="true"`. Depende de T006

**Checkpoint**: la app compila, los tests existentes pasan y el formulario muestra el interruptor

---

## Phase 3: User Story 1 - Activar o desactivar la aprobación al editar (Priority: P1) 🎯 MVP

**Goal**: al editar, el interruptor muestra el valor guardado y el nuevo valor se guarda. Si cambió,
tras el toast de éxito aparece el toast informativo de alcance.

**Independent Test**: editar una categoría en No, activar, guardar: toast "Categoría actualizada" y,
al cerrarse, "Aprobación activada" con el texto de alcance; reabrir: el interruptor está en Sí.

### Tests for User Story 1

- [X] T009 [P] [US1] Casos en `src/app/core/services/notification.service.spec.ts` para la opción `queue`: (a) `success('Uno')` y luego `info('Dos', undefined, { queue: true })` → el segundo NO se abre hasta que el primero emite `afterDismissed`; entonces se abre sin llamar a `dismiss` antes; (b) `info('Dos', undefined, { queue: true })` sin ningún toast abierto → se abre enseguida; (c) sin la opción, el comportamiento actual no cambia (el caso existente "cierra el toast anterior…" sigue pasando); (d) `success('Uno')`, luego `info('Dos', undefined, { queue: true })` y después `error('Tres')` → se abren "Uno" y "Tres", y "Dos" no se abre nunca, ni siquiera tras cerrarse "Tres". El `snackBar` simulado debe devolver una referencia con `afterDismissed()` (un `Subject`). Deben fallar antes de T011
- [X] T010 [US1] Casos en `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.spec.ts`: (a) editar una categoría con `requiresApproval: true` → interruptor activado y texto "Sí"; con `false` → desactivado y "No"; (b) cambiar el interruptor y guardar → `categoriesService.update` recibe `requiresApproval` con el nuevo valor; (c) respuesta con valor distinto del original → `notifications.success` ("Categoría actualizada") y después `notifications.info` con título "Aprobación activada" (o "Aprobación desactivada") y la descripción de alcance, con `{ queue: true }`; (d) respuesta con el mismo valor (no se tocó el interruptor, o se cambió y se devolvió a su valor) → solo `success`, `info` no se llama; (e) no se muestra ningún aviso de alcance en el formulario antes de guardar (FR-003); (f) errores al guardar: con 500 y con 403, el interruptor conserva su valor y vuelve a estar habilitado, se muestra `<app-alert>` con el mensaje habitual de cada caso ("No fue posible guardar los cambios. Intente de nuevo." / "No es posible editar la categoría. Verifique sus permisos o que la categoría siga activa.") y `notifications.info` no se llama; (g) el diálogo se cierra con `kind: 'updated'` y `category.requiresApproval` igual al de la respuesta. Deben fallar antes de T011–T012

### Implementation for User Story 1

- [X] T011 [US1] En `src/app/core/services/notification.service.ts`: añadir `export interface ToastOptions { queue?: boolean }` y un tercer parámetro opcional `options?: ToastOptions` a `info`, `success`, `warning` y `error`, que se pasa a `show`. Guardar la referencia del toast abierto (`MatSnackBarRef` devuelta por `openFromComponent`) y limpiarla en su `afterDismissed`. En `show`: si `options?.queue` y hay un toast abierto, guardar el nuevo como pendiente y abrirlo al emitir `afterDismissed` del abierto (sin llamar a `dismiss`); si no hay ninguno abierto, abrirlo enseguida. Sin `queue`: descartar el pendiente (si lo hay) **antes** de `dismiss()` y abrir el nuevo, de modo que el pendiente no se abra nunca. Comentario en español que explique para qué sirve (HU-31, research R5). Mantener la carga diferida del snackbar
- [X] T012 [US1] En `handleSuccess` de `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.ts`, rama de edición: tras el `notifications.success` actual, si `res.requiresApproval !== this.originalRequiresApproval`, llamar a `notifications.info(título, $localize\`:@@categories.toast.approvalScope.description:…\`, { queue: true })` con título `@@categories.toast.approvalOn.title` si `res.requiresApproval` es `true` y `@@categories.toast.approvalOff.title` si es `false` (research R4, R6). En la creación no se llama (FR-003). Depende de T011

**Checkpoint**: US1 funciona y se prueba sola (editar, guardar, dos toasts, reabrir)

---

## Phase 4: User Story 2 - Elegir la aprobación al crear (Priority: P1)

**Goal**: al crear, el interruptor está en No y se puede activar; el valor se guarda y no aparece el
aviso de alcance.

**Independent Test**: crear una categoría con el interruptor activado → aparece "Sí" en el listado;
crear otra sin tocarlo → "No".

### Tests for User Story 2

- [X] T013 [US2] Casos de creación en `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.spec.ts`: (a) al abrir, el interruptor está desactivado y el texto dice "No"; (b) guardar sin tocarlo → `categoriesService.create` recibe `requiresApproval: false`; (c) activarlo y guardar → `requiresApproval: true`, se llama `notifications.success` ("Categoría creada") y `notifications.info` NO se llama; (d) mientras se guarda, el interruptor está deshabilitado (`form.disable()`). Si alguno falla, corregir `category-form-dialog.component.ts` (T005)

**Checkpoint**: US1 y US2 funcionan de forma independiente

---

## Phase 5: User Story 3 - Advertir cuando hay pocos aprobadores (Priority: P2)

**Goal**: al activar el interruptor sin estarlo antes, si hay menos de dos aprobadores activos, una
advertencia no bloqueante bajo el interruptor.

**Independent Test**: con un solo aprobador activo, activar → aparece la advertencia y se puede
guardar; con dos, no aparece; en una categoría que ya estaba en Sí, no aparece.

### Tests for User Story 3

- [X] T014 [P] [US3] Casos de `isActiveApprover` en `src/app/core/auth/permissions.spec.ts`: ACTIVE + `canApprove` + EDITOR → `true`; ACTIVE + `canApprove` + ADMIN → `true`; INACTIVE + `canApprove` → `false`; ACTIVE sin `canApprove` → `false`; ACTIVE + `canApprove` + READER → `false`
- [X] T015 [US3] Casos en `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.spec.ts`: (a) creación con `usersService.list` devolviendo 1 aprobador activo (más un inactivo con permiso y un READER, que no cuentan) → sin advertencia con el interruptor en No; al activarlo aparece "Hay menos de dos usuarios con permiso de aprobar. Los documentos que cargue un aprobador no podrán ser aprobados por él mismo." y el botón de guardar sigue habilitado; al desactivarlo desaparece; (b) con 2 aprobadores activos → no aparece; (c) edición de una categoría con `requiresApproval: false` y 0 aprobadores → aparece al activar; (d) edición de una categoría con `requiresApproval: true` → `usersService.list` NO se llama y no hay advertencia; (e) `usersService.list` con error → no hay advertencia, no se llama a ningún método de `NotificationService` y se puede guardar; (f) con la advertencia visible, guardar llama a `create`/`update` con normalidad y la advertencia no se repite en ningún toast (FR-006, FR-008); (g) la advertencia se renderiza dentro de un elemento con `role="alert"`, para que se anuncie al aparecer (FR-013); (h) con `usersService.list` que aún no ha respondido (`NEVER` o un `Subject` sin emitir), activar el interruptor no muestra la advertencia y se puede guardar (Edge Cases, "respuesta aún pendiente"). Deben fallar antes de T016–T018

### Implementation for User Story 3

- [X] T016 [P] [US3] Añadir `isActiveApprover(user: User): boolean` en `src/app/core/auth/permissions.ts`: `user.status === 'ACTIVE' && user.canApprove && canHoldApprovalPermission(user.role)`, con comentario en español ("Aprobador activo: misma definición que `countActiveApprovers` del backend (HU-31)"). Importar `User` desde `@core/models/user.model` o por ruta relativa dentro de `core`, según el resto del archivo
- [X] T017 [US3] En `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.ts`: inyectar `UsersService`; `activeApprovers = signal<number | null>(null)`; en `ngOnInit`, si `!this.originalRequiresApproval`, `usersService.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (res) => this.activeApprovers.set(res.users.filter(isActiveApprover).length), error: () => {} })` con comentario de por qué se ignora el error (research R3); `showApproverWarning = computed(() => this.requiresApprovalValue() && !this.originalRequiresApproval && (this.activeApprovers() ?? 2) < 2)`. No cambia `canSubmit` (FR-006). Depende de T016
- [X] T018 [US3] En `src/app/features/categories/category-list/components/category-form-dialog/category-form-dialog.component.html`, bajo el interruptor: `@if (showApproverWarning()) { <app-alert class="approval-field__warning" variant="warning">` con `@@categories.form.approval.fewApprovers` `</app-alert> }`; en el SCSS, margen superior con `--space-*` y texto a `--text-base` si `app-alert` usa un tamaño menor (UI-08). Depende de T017. **Nota:** `app-alert` fija `--text-md` (14 px) en su propio SCSS y no se puede cambiar desde fuera sin `::ng-deep` (prohibido); se mantiene como en el aviso de HU-32. Ajustar el componente compartido es deuda de UI-08 fuera de esta HU

**Checkpoint**: US1, US2 y US3 funcionan de forma independiente

---

## Phase 6: User Story 4 - Ver qué categorías requieren aprobación en el listado (Priority: P2)

**Goal**: columna "Requiere aprobación" en la tabla y etiqueta "Aprobación: Sí/No" en las tarjetas,
atenuadas en las categorías inactivas.

**Independent Test**: con una categoría con aprobación y otra sin ella, el listado muestra "Sí" y
"No" en la tabla y en las tarjetas; una inactiva con "Sí" lo muestra atenuado.

### Tests for User Story 4

- [X] T019 [P] [US4] Crear `src/app/features/categories/category-list/components/category-approval-badge.component.spec.ts`: (a) `requiresApproval = true`, tamaño `md` → texto "Sí" y variante `primary`; (b) `false` → "No" y variante `neutral`; (c) tamaño `sm` → "Aprobación: Sí" / "Aprobación: No" con el icono `approval` (`aria-hidden="true"`); (d) `muted = true` con `requiresApproval = true` → variante `neutral` y el texto sigue siendo "Sí"
- [X] T020 [P] [US4] Casos en `src/app/features/categories/category-list/category-list.component.spec.ts`: la tabla tiene la cabecera "Requiere aprobación" entre "Sensibilidad por defecto" y "Documentos"; cada fila muestra `app-category-approval-badge` con el valor de su categoría; cada tarjeta muestra la etiqueta en tamaño `sm`; una categoría inactiva la muestra con `muted`

### Implementation for User Story 4

- [X] T021 [US4] Crear `src/app/features/categories/category-list/components/category-approval-badge.component.ts` (selector `app-category-approval-badge`, OnPush, plantilla inline ≤ 40 líneas, sin `styles`): inputs `requiresApproval = input.required<boolean>()`, `size = input<'md' | 'sm'>('md')`, `muted = input(false)`; sobre `app-badge` con variante `computed` (`primary` si `requiresApproval() && !muted()`, si no `neutral`); en `sm`, icono `mat-icon` `approval` (`aria-hidden="true"`, tamaño con `icon.size` en un `styleUrl` si hace falta) y `@@categories.approval.cardYes`/`cardNo`; en `md`, `@@categories.approval.yes`/`no`. Textos con `$localize` en constantes o `@if` en plantilla, nunca en ternarios de bindings (CAL-02). Research R8
- [X] T022 [US4] En `src/app/features/categories/category-list/category-list.component.html`: añadir `<col class="col-approval" />` tras `col-sensitivity`; cabecera `<th i18n="@@categories.field.requiresApproval">Requiere aprobación</th>` entre "Sensibilidad por defecto" y "Documentos"; celda con `<app-category-approval-badge [requiresApproval]="category.requiresApproval" [muted]="isMuted(category)" />`; en las tarjetas, dentro de `category-card__meta` y tras `app-sensitivity-badge`, `<app-category-approval-badge [requiresApproval]="category.requiresApproval" size="sm" [muted]="isMuted(category)" />`. Importar el componente en `category-list.component.ts`. Depende de T021
- [X] T023 [US4] En `src/app/features/categories/category-list/category-list.component.scss`: `.col-approval` con ancho fijo (p. ej. `120px`, como las demás columnas fijas) y rebajar los porcentajes de `.col-category`, `.col-description` y `.col-sensitivity` para que la tabla quepa a 1280 px con el menú lateral; actualizar el comentario que explica el reparto (hoy "los porcentajes suman un 50 % … con los 460 px fijos"). Validar visualmente con `npm start` a 1280 px. Depende de T022

**Checkpoint**: las cuatro historias funcionan de forma independiente

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: i18n, E2E, documentación y puertas de calidad

- [X] T024 Ejecutar `npm run extract-i18n` y añadir a `src/locale/messages.en.xlf` las traducciones de los IDs nuevos: "Requires approval", "Documents in this category will go through the approval workflow.", "There are fewer than two users with approval permission. Documents uploaded by an approver cannot be approved by that same person.", "Yes", "No", "Approval: Yes", "Approval: No", "Approval enabled", "Approval disabled", "This change only affects documents uploaded from now on. Existing documents keep their current status."
- [X] T025 [P] E2E: con el fixture de T004, regenerar en Windows las capturas `e2e/visual.spec.ts-snapshots/categories-desktop-win32.png` y `categories-mobile-600-win32.png` con `npm run e2e -- --update-snapshots`, y revisar que la tabla no se desborda y que las tarjetas muestran "Aprobación: Sí/No"
- [X] T026 [P] Añadir la entrada de la HU-31 en `CHANGELOG.md` (sección de la próxima versión, en español), siguiendo el formato de la entrada de la HU-32
- [X] T027 Ejecutar las puertas: `npm run lint`, `npm run check:styles`, `npm run test:ci` (umbrales de cobertura sin bajar), `npm run build` (es y en) y `npm run format:check`; corregir lo que falle
- [X] T028 Recorrer las comprobaciones manuales de `specs/002-category-approval-config/quickstart.md` (1–13) contra el backend `feature/hu-31` y anotar el resultado en este archivo. **Resultado:** validado por el usuario contra el backend `feature/hu-31` el 2026-09-27

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: T002/T003 → T004 y T005 → T006 → T008; T007 depende de T001
- **User Stories (Phases 3–6)**: todas dependen de la fase 2
- **Polish (Phase 7)**: depende de las historias que se entreguen

### User Story Dependencies

- **US1 (P1)**: tras la fase 2. Añade la opción `queue` de `NotificationService`
- **US2 (P1)**: tras la fase 2; solo pruebas (la lógica la da T005). Independiente de US1
- **US3 (P2)**: tras la fase 2. Independiente; comparte archivo con US1/US2 (formulario), así que
  no se hace en paralelo con ellas
- **US4 (P2)**: tras la fase 2 (T002). Independiente del formulario: se puede hacer en paralelo con
  US1–US3

### Within Each User Story

- Los tests se escriben antes y deben fallar
- Modelos y funciones de `core` antes que componentes
- Lógica del componente antes que la plantilla

### Parallel Opportunities

- T002 y T003 (modelos distintos)
- T007 en paralelo con T005/T006 (estilos, tras T001)
- T009 (notificaciones) en paralelo con T010 (formulario)
- T014 y T016 (`permissions`) en paralelo con el trabajo del formulario
- Toda la fase 6 (US4: listado) en paralelo con las fases 3–5 (formulario)
- T025 y T026 en paralelo

---

## Parallel Example: User Story 4 junto a User Story 1

```text
# Persona A (formulario, US1):
T009 notification.service.spec.ts → T011 notification.service.ts
T010 category-form-dialog.component.spec.ts → T012 category-form-dialog.component.ts

# Persona B (listado, US4):
T019 category-approval-badge.component.spec.ts → T021 category-approval-badge.component.ts
T020 category-list.component.spec.ts → T022 category-list.component.html → T023 category-list.component.scss
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Fase 1 y fase 2 (tipos, fixtures, interruptor en el formulario)
2. Fase 3 (US1: editar, guardar, avisos tras guardar)
3. **Parar y validar**: editar Actas y Resoluciones, activar la aprobación y comprobar los toasts

### Incremental Delivery

1. Fases 1–2 → base lista
2. US1 → editar (MVP) → validar
3. US2 → crear → validar
4. US3 → advertencia de aprobadores → validar
5. US4 → listado → validar
6. Fase 7 → i18n, capturas, CHANGELOG y puertas de calidad

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- Commit por tarea o grupo lógico, con Conventional Commits en español, solo cuando se pida
- No bajar umbrales de cobertura ni subir presupuestos de `angular.json`
