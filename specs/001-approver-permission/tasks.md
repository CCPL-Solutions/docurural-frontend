---

description: "Tareas de implementación de la HU-32 (permiso para aprobar documentos)"
---

# Tasks: Permiso para aprobar documentos (HU-32)

**Input**: documentos de diseño en `specs/001-approver-permission/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/users-api.md, quickstart.md

**Tests**: incluidos. La constitución (CAL-07, CAL-08) exige specs junto al archivo y E2E de los
flujos, y el plan los detalla en research R12. Patrón zoneless: _act → `await fixture.whenStable()`
→ assert_.

**Organization**: tareas agrupadas por historia de usuario (US1–US5 de spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1…US5)
- Rutas relativas a la raíz del repositorio

## Reglas que aplican a todas las tareas

- Textos de interfaz en español, tratando de usted, marcados con `i18n="@@id"` o
  `` $localize`:@@id:Texto` `` usando los IDs de research R11. Oraciones con punto final; títulos y
  etiquetas sin él.
- Colores, tamaños, espaciados y radios solo con tokens de `src/styles/_tokens.scss`; media
  queries con `bp.*`; iconos con `icon.size(Npx)`.
- Ninguna comparación de rol fuera de `src/app/core/auth/permissions.ts` (RUT-02).
- Nada lee el permiso de la sesión ni del JWT (FR-017).

---

## Phase 1: Setup

**Purpose**: verificar lo que el plan dejó pendiente de comprobar

- [X] T001 Comprobar si la clase `cdk-visually-hidden` está disponible globalmente (buscar `mat.core`, `cdk.a11y-visually-hidden` o `@angular/cdk/a11y-prebuilt` en `src/styles.scss` y `src/styles/`). Si no lo está, añadir una utilidad `.visually-hidden` en un parcial de `src/styles/` siguiendo `src/styles/README.md`, y anotar en este archivo qué clase usar en T025. **Resultado:** no está disponible globalmente; se añadió `.visually-hidden` en `src/styles/_a11y.scss`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tipos, regla de rol y andamiaje del formulario que necesitan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

- [X] T002 [P] Añadir `canApprove: boolean` a la interfaz `User` en `src/app/core/models/user.model.ts` ("Siempre presente en las respuestas. `false` en usuarios anteriores a la HU"). NO tocar `AuthenticatedUser` (FR-017)
- [X] T003 [P] En `src/app/core/models/user-form.model.ts`: añadir `canApprove: boolean` (obligatorio) a `CreateUserRequest`, `canApprove?: boolean` (opcional, "Se omite en la autoedición") a `UpdateUserRequest` y `canApprove: boolean` a `UpdateUserResponse`
- [X] T004 [P] Añadir `canHoldApprovalPermission(role: Role | null | undefined): boolean` (`isAdmin(role) || isEditor(role)`) con comentario en español en `src/app/core/auth/permissions.ts`, y casos ADMIN → `true`, EDITOR → `true`, READER → `false`, `null`/`undefined` → `false` en `src/app/core/auth/permissions.spec.ts`
- [X] T005 Actualizar los objetos `User` de prueba para que compilen con el campo nuevo (`canApprove: false` salvo que el caso diga otra cosa) en `src/app/features/users/user-list/user-list.component.spec.ts`, `src/app/features/users/toggle-status-dialog/toggle-status-dialog.component.spec.ts` y cualquier otro spec que construya un `User` (buscar `lastLogin:` en `src/app/**/*.spec.ts`); en `UserFormDialogResult` (`src/app/features/users/user-form-dialog/user-form-dialog.component.ts`) el caso `kind: 'updated'` debe exponer `canApprove` (usar `Omit<UpdateUserResponse, 'message'>`). Depende de T002 y T003
- [X] T006 Andamiaje del control en `src/app/features/users/user-form-dialog/user-form-dialog.component.ts`: añadir `canApprove: [false]` al grupo `fb.nonNullable`; exponer el rol como signal `selectedRole` (`toSignal(this.form.controls.role.valueChanges, { initialValue: this.form.controls.role.value })`; el `patchValue` de `ngOnInit` emite y lo actualiza. Todo identificador nuevo va en inglés, CAL-11); añadir un método privado `syncApproverControl()` que deshabilite `canApprove` si `loading()`, si `isSelfEdit()` o si `!canHoldApprovalPermission(this.selectedRole())` con un rol ya elegido, y lo habilite en otro caso (sin emitir eventos: `{ emitEvent: false }`); llamarlo al final de `ngOnInit` y en `unlockForm()` tras `form.enable()` (durante el guardado `form.disable()` ya la bloquea). Depende de T004
- [X] T007 Bloque visual en `src/app/features/users/user-form-dialog/user-form-dialog.component.html`, después de "Confirmar contraseña" y antes del pie: título de sección "Aprobación de documentos" (`@@users.form.approval.section`, un `<span id>` o `<div id>`, no `<label>`); `<label class="approval">` que envuelve `<input type="checkbox" formControlName="canApprove" id="canApprove" [attr.aria-describedby]="'canApprove-hint'">`, el texto "Puede aprobar documentos" (`@@users.form.approval.label`) y un `<span id="canApprove-hint">` para la ayuda (se rellena en US1/US3). Depende de T006
- [X] T008 [P] Estilos de la tarjeta en `src/app/features/users/user-form-dialog/user-form-dialog.component.scss` siguiendo el artboard 4.1–4.3: borde `--color-border`, radio `--radius-*`, relleno `--space-*`; marcada → fondo `--color-purple-light`; deshabilitada → fondo `--color-neutral-light` y texto atenuado, `cursor: not-allowed`; casilla con `accent-color: var(--color-primary)`; foco visible con el anillo que ya usan `field__control`. Etiqueta de la casilla y texto de ayuda con `--text-base` (16 px, UI-08: la ayuda explica el permiso, no es un caption); NO reutilizar `field__hint` (14 px)
- [X] T009 Crear `src/app/features/users/user-form-dialog/user-form-dialog.component.spec.ts` con el arnés: `TestBed` con `MAT_DIALOG_DATA` configurable (crear / editar otro / autoedición), `MatDialogRef` simulado (`close`, `disableClose`), `UsersService` simulado (`create`, `update` devolviendo `of(...)` o `throwError`), `NotificationService` simulado (`success`) y `AuthService` con `currentUser` signal; helpers para rellenar campos válidos y elegir rol. Primer caso: el formulario tiene el control `canApprove` y el bloque "Aprobación de documentos" se renderiza. Depende de T007

**Checkpoint**: la app compila, los tests existentes pasan y el formulario muestra la casilla (sin lógica de rol todavía)

---

## Phase 3: User Story 1 - Conceder o retirar el permiso al editar (Priority: P1) 🎯 MVP

**Goal**: el administrador marca o desmarca la casilla al editar a un ADMIN/EDITOR; el valor se guarda. La autoedición la bloquea.

**Independent Test**: editar un EDITOR sin permiso, marcar, guardar, reabrir: aparece marcada; desmarcar y comprobar lo contrario. Editar su propia cuenta: casilla bloqueada.

### Tests for User Story 1

- [X] T010 [US1] Casos en `src/app/features/users/user-form-dialog/user-form-dialog.component.spec.ts`: (a) editar un EDITOR con `canApprove: true` → casilla marcada y habilitada; (b) marcar/desmarcar y guardar envía `canApprove` con ese valor en `usersService.update`; (c) con rol ADMIN la ayuda dice "El rol Administrador no incluye este permiso: márquelo solo si esta persona debe aprobar."; con EDITOR, "Podrá revisar y aprobar los documentos enviados a aprobación."; (d) autoedición → casilla deshabilitada con su valor, ayuda "No puede cambiar su propio permiso de aprobación." y el `PUT` NO incluye la propiedad `canApprove` (`expect('canApprove' in req).toBe(false)`); (e) tras un error 500 la casilla vuelve a estar habilitada (no autoedición) o deshabilitada (autoedición). Deben fallar antes de T011–T013

### Implementation for User Story 1

- [X] T011 [US1] En `src/app/features/users/user-form-dialog/user-form-dialog.component.ts`: incluir `canApprove` en el `patchValue` de edición; añadir `approvalHint = computed(...)` que devuelve, por prioridad, autoedición → `@@users.form.approval.hintSelf` "No puede cambiar su propio permiso de aprobación."; ADMIN → `@@users.form.approval.hintAdmin`; EDITOR → `@@users.form.approval.hintEditor`; READER → `@@users.form.approval.hintReader` "Los lectores no pueden aprobar documentos." (con punto, CAL-01); sin rol → cadena vacía. Usar funciones de `permissions.ts` (`isAdmin`, `isEditor`, `canHoldApprovalPermission`) para decidir, nunca literales de rol
- [X] T012 [US1] En el mismo archivo, al construir `UpdateUserRequest`: si `isSelfEdit()` no añadir `canApprove`; si no, `canApprove: raw.canApprove` (usar `getRawValue()`, que incluye controles deshabilitados)
- [X] T013 [US1] Mostrar `approvalHint()` en el `<span id="canApprove-hint">` de `src/app/features/users/user-form-dialog/user-form-dialog.component.html`, con un icono `lock` (`aria-hidden="true"`) cuando la casilla está deshabilitada por autoedición o por rol lector; aplicar la clase de tarjeta marcada/deshabilitada según el estado del control

**Checkpoint**: US1 funciona y se prueba sola (editar, guardar, autoedición)

---

## Phase 4: User Story 2 - Conceder el permiso al crear (Priority: P1)

**Goal**: el formulario de creación muestra la casilla desmarcada y envía su valor.

**Independent Test**: crear un EDITOR con la casilla marcada; la petición lleva `canApprove: true`.

### Tests for User Story 2

- [X] T014 [US2] Casos en `src/app/features/users/user-form-dialog/user-form-dialog.component.spec.ts`: (a) en creación la casilla aparece desmarcada; (b) crear un EDITOR marcándola envía `canApprove: true` en `usersService.create`; (c) crear sin tocarla envía `canApprove: false`. Deben fallar antes de T015

### Implementation for User Story 2

- [X] T015 [US2] Añadir `canApprove: raw.canApprove` al `CreateUserRequest` de `onSubmit` en `src/app/features/users/user-form-dialog/user-form-dialog.component.ts` (el tipo lo exige desde T003)

**Checkpoint**: US1 y US2 funcionan por separado

---

## Phase 5: User Story 3 - Impedir el permiso a los lectores (Priority: P1)

**Goal**: con rol Lector la casilla se desmarca y bloquea; si el usuario tenía el permiso, aviso antes de guardar y toast específico al guardar; al volver a ADMIN/EDITOR recupera el valor.

**Independent Test**: editar un EDITOR aprobador, pasar a Lector (aviso, casilla bloqueada), volver a Editor (casilla marcada), pasar otra vez a Lector y guardar (toast de retirada).

### Tests for User Story 3

- [X] T016 [US3] Casos en `src/app/features/users/user-form-dialog/user-form-dialog.component.spec.ts`: (a) creación con rol READER → casilla desmarcada, deshabilitada y ayuda "Los lectores no pueden aprobar documentos." (con punto); al crear se envía `canApprove: false`; (b) editar un EDITOR con `canApprove: true` y elegir READER → casilla `false` deshabilitada y aparece el aviso con el nombre del usuario; (c) volver a EDITOR → casilla `true` habilitada y sin aviso (Clarifications: recupera el valor); (d) editar un READER y elegir EDITOR → casilla `false` habilitada, sin aviso; (e) editar un EDITOR sin permiso y elegir READER → sin aviso; (f) guardar el caso (b) envía `role: 'READER'`, `canApprove: false`, y si la respuesta trae `canApprove: false` el toast es `success('Usuario actualizado', 'Se retiró el permiso para aprobar documentos.')`; (g) en el resto de ediciones el toast sigue siendo el actual; (h) un 400 sin `fieldErrors` con cuerpo `{ message: 'Los lectores no pueden aprobar documentos' }` muestra ese mensaje en `<app-alert>`; sin `message`, el genérico `@@common.error.invalidData`. Deben fallar antes de T017–T021

### Implementation for User Story 3

- [X] T017 [US3] En `src/app/features/users/user-form-dialog/user-form-dialog.component.ts`: suscribirse a `this.form.controls.role.valueChanges` con `takeUntilDestroyed(this.destroyRef)` (puente con FormControl, EST-05). Crear la suscripción al final de `ngOnInit`, después del `patchValue` y de inicializar `rememberedCanApprove`, para que el relleno inicial no dispare la restauración. Al pasar de un rol que puede tener el permiso a uno que no: guardar el valor actual en el campo privado `rememberedCanApprove` y `setValue(false)`; al pasar de uno que no puede a uno que sí: `setValue(this.rememberedCanApprove)`; en ambos casos llamar a `syncApproverControl()`. Inicializar `rememberedCanApprove` (antes de suscribirse) con el valor de `canApprove` tras el `patchValue` (`false` si el usuario es READER o en creación). No escribir en signals desde la suscripción
- [X] T018 [US3] Añadir `showRevokeWarning = computed(() => isEdit() && !isSelfEdit() && data.user?.canApprove === true && !canHoldApprovalPermission(this.selectedRole()) && this.selectedRole() !== '')` en el mismo archivo
- [X] T019 [US3] En `src/app/features/users/user-form-dialog/user-form-dialog.component.html`, bajo la tarjeta: `@if (showRevokeWarning()) { <app-alert variant="warning" title="Se retirará el permiso de aprobación." i18n-title="@@users.form.approval.revokeTitle"> <ng-container i18n="@@users.form.approval.revokeBody">Al cambiar el rol a Lector, {{ data.user?.fullName }} dejará de poder aprobar documentos cuando guarde los cambios.</ng-container> </app-alert> }` (el `role="alert"` del componente lo anuncia, FR-016). El título es una oración completa y lleva punto, como en la spec
- [X] T020 [US3] En el `next` del `update` de `onSubmit` (mismo `.ts`): si `data.user?.canApprove === true` y `res.canApprove === false` y el rol enviado no puede tener el permiso, notificar `success(@@users.toast.updated.title, $localize\`:@@users.toast.updated.approvalRevoked:Se retiró el permiso para aprobar documentos.\`)`; si no, el toast actual. Al construir la petición, forzar `canApprove: false` cuando `!canHoldApprovalPermission(role)` (FR-009), aunque el control ya valga `false`
- [X] T021 [US3] En `handleError` (mismo `.ts`), caso `BadRequest`: si `applyFieldErrors` devuelve `false`, usar `toApiError(err)?.message` (importar de `@shared/http/api-error`) y, si no hay, el texto actual `@@common.error.invalidData` (research R6; nunca `err.error`, API-01)

**Checkpoint**: US1, US2 y US3 (todo el formulario) funcionan; es el MVP

---

## Phase 6: User Story 4 - Identificar a los aprobadores en el listado (Priority: P2)

**Goal**: etiqueta "Aprobador" junto al nombre (tabla) o junto a rol y estado (tarjetas), atenuada y explicada si el usuario está inactivo.

**Independent Test**: con un aprobador activo, uno inactivo y un usuario sin permiso, el listado muestra la etiqueta normal, atenuada y ninguna, respectivamente.

### Tests for User Story 4

- [X] T022 [P] [US4] Crear `src/app/features/users/user-list/components/approver-badge.component.spec.ts`: sin `inactive` muestra "Aprobador" con la variante `accent`; con `inactive` usa `neutral` e incluye el texto oculto "Inactivo: no cuenta como aprobador activo"
- [X] T023 [P] [US4] Casos en `src/app/features/users/user-list/user-list.component.spec.ts`: con usuarios `{canApprove: true, ACTIVE}`, `{canApprove: true, INACTIVE}` y `{canApprove: false}`, hay exactamente dos `app-approver-badge`, uno con `inactive` y el usuario sin permiso no tiene ninguno (comprobar tabla y, si el spec ya cubre la vista en tarjetas, también ahí)

### Implementation for User Story 4

- [X] T024 [P] [US4] Añadir la variante `'accent'` a `BadgeVariant` en `src/app/shared/components/badge/badge.component.ts` y sus estilos en `src/app/shared/components/badge/badge.component.scss` (fondo `--color-purple-light`, texto `--color-purple-text`, punto `--color-purple`), siguiendo el formato de las variantes existentes
- [X] T025 [US4] Crear `src/app/features/users/user-list/components/approver-badge.component.ts` (selector `app-approver-badge`, OnPush, plantilla inline ≤ 40 líneas, `inactive = input(false)`): `app-badge` con variante `accent` o `neutral`, `<mat-icon aria-hidden="true">verified</mat-icon>` con `icon.size()` si hace falta estilo (en ese caso `styleUrl` propio), texto "Aprobador" (`@@users.list.approverBadge`) y, si `inactive()`, un `<span>` con la clase visualmente oculta de T001 y el texto "Inactivo: no cuenta como aprobador activo" (`@@users.list.approverInactive`) más `matTooltip` con el mismo texto (`i18n-matTooltip`). Depende de T024
- [X] T026 [P] [US4] Añadir un `<ng-content />` justo después del nombre en `src/app/features/users/user-list/components/user-identity.component.ts` (nombre y contenido proyectado en una fila flexible con `gap: var(--space-2)`, el nombre truncable) y ajustar `src/app/features/users/user-list/components/user-identity.component.scss`
- [X] T027 [US4] En `src/app/features/users/user-list/user-list.component.html`: en la tabla (línea ~100) proyectar `@if (user.canApprove) { <app-approver-badge [inactive]="user.status === 'INACTIVE'" /> }` dentro de `<app-user-identity>`; en las tarjetas (línea ~141) añadir la misma etiqueta junto a `app-role-badge` y `app-status-badge`. Si el componente ya expone un helper de inactivo (`isMuted(user)`), usarlo en lugar de comparar el estado. Importar `ApproverBadgeComponent` en `src/app/features/users/user-list/user-list.component.ts`. Depende de T025 y T026
- [X] T028 [US4] Actualizar el fixture de `/users` en `e2e/support/fixtures.ts`: el ADMIN activo con `canApprove: true`, Luis Gómez (EDITOR inactivo) con `canApprove: true`, y `canApprove: false` en cualquier otro usuario simulado

**Checkpoint**: el listado muestra las etiquetas sin depender del formulario

---

## Phase 7: User Story 5 - Informar al desactivar o reactivar a un aprobador (Priority: P3)

**Goal**: la confirmación de activar/desactivar añade una línea sobre la aprobación solo para aprobadores.

**Independent Test**: abrir la confirmación para un aprobador y para un usuario sin permiso; la línea solo aparece en el primero.

### Tests for User Story 5

- [X] T029 [P] [US5] Casos en `src/app/features/users/toggle-status-dialog/toggle-status-dialog.component.spec.ts`: (a) desactivar un usuario con `canApprove: true` muestra "Dejará de contar como aprobador activo de documentos."; (b) activar uno con `canApprove: true` muestra "Conserva el permiso para aprobar documentos y vuelve a contar como aprobador activo."; (c) con `canApprove: false` no aparece ninguno de los dos; (d) la petición `updateStatus` no cambia (FR-014)

### Implementation for User Story 5

- [X] T030 [US5] En `src/app/features/users/toggle-status-dialog/toggle-status-dialog.component.ts` añadir `approverNote = computed(() => !this.data.user.canApprove ? null : this.isDeactivate() ? $localize\`:@@users.toggle.approverDeactivate:Dejará de contar como aprobador activo de documentos.\` : $localize\`:@@users.toggle.approverActivate:Conserva el permiso para aprobar documentos y vuelve a contar como aprobador activo.\`)`, y en `toggle-status-dialog.component.html` un `@if (approverNote(); as note) { <p class="dialog__hint">{{ note }}</p> }` tras el `secondaryMessage`

**Checkpoint**: todas las historias funcionan por separado

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T031 Ejecutar `npm run extract-i18n` y traducir en `src/locale/messages.en.xlf` los IDs nuevos (research R11: `users.form.approval.*`, `users.toast.updated.approvalRevoked`, `users.list.approverBadge`, `users.list.approverInactive`, `users.toggle.approverDeactivate`, `users.toggle.approverActivate`), sin avisos de extracción
- [X] T032 [P] Añadir la entrada de la HU-32 en la sección 1.1.0 de `CHANGELOG.md` (en español): casilla "Puede aprobar documentos" en crear/editar, bloqueo para lectores y en la autoedición, aviso y toast de retirada, etiqueta "Aprobador" en el listado y nota en activar/desactivar
- [X] T033 Ejecutar `npm run lint`, `npm run check:styles`, `npm run test:ci` (sin bajar umbrales) y `npm run format:check`; corregir lo que falle
- [X] T034 Ejecutar `npm run build` (ambos idiomas, `i18nMissingTranslation: error`) y `npm run e2e:ci`
- [X] T035 En Windows, regenerar la captura del listado con `npm run e2e -- --update-snapshots` (cambia a propósito por la etiqueta "Aprobador") y revisar el diff de `e2e/visual.spec.ts-snapshots/`
- [X] T036 Validar manualmente los 14 escenarios de `specs/001-approver-permission/quickstart.md` contra el backend `feature/hu-32`, incluida la comprobación de red (autoedición sin `canApprove`) y la revisión de UI-08 (cuerpo ≥ 16 px en ayuda y aviso)
- [X] T037 Corrección tras la validación en Desarrollo: en móvil el formulario de usuario no hacía scroll y los botones quedaban fuera de la vista. Envolver los campos de `src/app/features/users/user-form-dialog/user-form-dialog.component.html` en `<form class="dialog-form">` y `<div class="dialog-fields">` (patrón de `_dialog-shell.scss`), con `.dialog-footer` fuera del área con scroll
- [X] T038 Segunda corrección tras la validación en Desarrollo: en móvil el último botón seguía tapado porque `max-height` en `vh` incluye las barras del navegador. En `src/styles/_dialog-shell.scss`, añadir `max-height` en `dvh` tras la de `vh` (88dvh y, en `bp.sm`, 96dvh)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: sin dependencias; su resultado lo usa T025
- **Foundational (T002–T009)**: bloquea todas las historias
- **US1 → US2 → US3**: comparten `user-form-dialog.component.ts|html|spec.ts`, así que van en secuencia
- **US4 (T022–T028)** y **US5 (T029–T030)**: solo dependen de Foundational; se pueden hacer en paralelo con US1–US3 y entre sí
- **Polish (T031–T036)**: al final de las historias que se entreguen

### Dentro de cada historia

- Los tests se escriben primero y deben fallar
- Tipos → lógica del componente → plantilla

### Parallel Opportunities

- T002, T003 y T004 (archivos distintos)
- T008 junto con T006–T007
- US4 entera junto a US1–US3; dentro de US4, T022, T023, T024 y T026
- US5 entera junto a US4
- T032 junto a T031

---

## Parallel Example: User Story 4

```text
Task: "T022 Spec de approver-badge en src/app/features/users/user-list/components/approver-badge.component.spec.ts"
Task: "T023 Casos de etiqueta en src/app/features/users/user-list/user-list.component.spec.ts"
Task: "T024 Variante accent en src/app/shared/components/badge/badge.component.ts|scss"
Task: "T026 <ng-content> en src/app/features/users/user-list/components/user-identity.component.ts"
```

---

## Implementation Strategy

### MVP (US1 + US2 + US3)

Las tres historias P1 forman el formulario completo, y la regla de lectores es la que protege el
flujo. Orden: Setup → Foundational → US1 → US2 → US3 → **validar** los escenarios 1–8 de
quickstart.md.

### Incremental Delivery

1. MVP (formulario) → validar
2. US4 (etiqueta en el listado) → validar escenarios 2, 10 y 13
3. US5 (nota en activar/desactivar) → validar escenarios 9, 11 y 12
4. Polish → definición de terminado

---

## Notes

- Brecha del backend (research R3): el servidor no bloquea el cambio del propio `canApprove`. El
  frontend omite el campo en la autoedición (T012). Queda como seguimiento en `docurural-backend`,
  fuera de estas tareas.
- El contador de aprobadores activos y el rediseño del diálogo de activar/desactivar quedan fuera
  (Clarifications y Assumptions de la spec).
- Hacer commit por tarea o grupo lógico, con Conventional Commits en español y solo cuando se pida.
