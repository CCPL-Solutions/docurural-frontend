# Research: Permiso para aprobar documentos (HU-32)

Fase 0 del plan. Resuelve las incógnitas del contexto técnico con el código actual del frontend,
el contrato ya implementado en `docurural-backend` (rama `feature/hu-32`, commit `26c3d52`,
`specs/001-user-approval-permission/contracts/users-api.md`) y el hand off de Claude Design
(`Users.html`, `approver-slides.jsx`).

## R1. Nombre y forma del campo en la API

- **Decision**: el campo es `canApprove: boolean`. Aparece siempre en las respuestas de
  `GET /api/users`, `POST /api/users` (201) y `PUT /api/users/{id}` (200). En las peticiones es
  opcional: al crear, omitirlo equivale a `false`; al editar, omitirlo conserva el valor actual.
- **Rationale**: es el contrato que el backend ya implementó y documentó. El frontend no necesita
  endpoints nuevos.
- **Alternatives considered**: ninguna; el contrato lo fija el backend.

## R2. Reglas del backend que el frontend debe respetar

- **Decision**: el frontend replica en el formulario las reglas del servidor para no depender de un
  error:
  - Crear READER con `canApprove: true` → 400 `INVALID_ARGUMENT` ("Los lectores no pueden aprobar
    documentos"). El formulario nunca lo envía.
  - Editar cambiando el rol a READER → 200 y el servidor fuerza `canApprove: false`, aunque se
    envíe `true`. El formulario envía `false` de todos modos.
  - Editar a un usuario que ya es READER con `canApprove: true` → 400. El formulario nunca lo envía.
- **Rationale**: SC-002 exige que el formulario lo impida sin esperar al servidor.
- **Alternatives considered**: confiar solo en el servidor; se descarta por SC-002.

## R3. Autoedición: el servidor no bloquea el propio permiso

- **Decision**: en la autoedición el formulario deshabilita la casilla y **omite** `canApprove` en
  el `PUT`. Como el backend conserva el valor cuando se omite, el permiso propio no puede cambiar
  desde la interfaz.
- **Rationale**: el backend no rechaza que un ADMIN cambie su propio `canApprove`
  (`UserServiceImpl.resolveCanApproveOnUpdate` no compara con el usuario autenticado). Omitir el
  campo garantiza el comportamiento pedido (Clarifications, opción B) sin depender de un cambio de
  backend.
- **Riesgo / seguimiento**: una petición manipulada puede cambiar el propio permiso. El borde de la
  spec "Rechazo del servidor … un cambio del propio permiso" **no se cumple hoy en el backend**. Se
  registra como seguimiento para `docurural-backend` (rechazar `canApprove` distinto del actual
  cuando `id` = usuario autenticado). No bloquea esta entrega del frontend.
- **Alternatives considered**: enviar el valor actual (funciona igual, pero enviar un valor que el
  usuario no puede cambiar es redundante y frágil si el valor quedó desactualizado).

## R4. Estado de la casilla en el formulario reactivo

- **Decision**: nuevo control `canApprove` (`boolean`, `false` por defecto) en el grupo
  `fb.nonNullable`. Un único método `syncApproverControl()` decide si está habilitado:
  deshabilitado si el rol es READER, si es autoedición o si se está guardando. Al pasar a READER se
  guarda el valor en un campo privado (`rememberedCanApprove`) y el control pasa a `false`; al salir
  de READER se restaura. El rol se expone como signal (`toSignal(role.valueChanges)` con valor
  inicial) para derivar con `computed()` el texto de ayuda y el aviso.
- **Rationale**: cumple FR-004 y FR-006 (Clarifications: recupera el valor). La suscripción a
  `valueChanges` es el puente permitido con `FormControl` (EST-05) y usa `takeUntilDestroyed`
  (EST-02). Centralizar la habilitación evita que `form.enable()` en `unlockForm()` reactive la
  casilla de un lector o de la autoedición, igual que ya pasa con el rol.
- **Alternatives considered**:
  - Dejar el valor `true` en un control deshabilitado y ocultarlo visualmente: `getRawValue()`
    enviaría `true` para un READER.
  - Un `linkedSignal` fuera del formulario: rompe el patrón Reactive Forms de FRM-01.

## R5. Aviso de retirada y toast

- **Decision**:
  - `showRevokeWarning = computed(isEdit && !isSelfEdit && data.user.canApprove && role() === 'READER')`.
    Se muestra con `<app-alert variant="warning">` (ya tiene `role="alert"`, FR-016) bajo la casilla.
  - Tras un `PUT` con éxito, si el usuario tenía el permiso y la respuesta trae `canApprove: false`
    con rol READER, el toast usa la descripción "Se retiró el permiso para aprobar documentos."
    con el título habitual "Usuario actualizado". En otro caso, el toast actual.
- **Rationale**: el diseño pide el aviso antes de guardar y un toast específico. Basar el toast en
  la respuesta del servidor refleja lo que de verdad se guardó.
- **Alternatives considered**: un diálogo de confirmación antes de guardar; descartado en la spec.

## R6. Error 400 sin errores de campo

- **Decision**: en `handleError`, si un 400 no trae `fieldErrors`, se muestra
  `toApiError(err)?.message` y, si no hay, el genérico actual.
- **Rationale**: cumple el borde "Rechazo del servidor: se muestra su mensaje" (el backend devuelve
  "Los lectores no pueden aprobar documentos"). Usa `toApiError` (API-01).
- **Alternatives considered**: mantener siempre el genérico; pierde el mensaje útil del servidor.

## R7. Regla de rol "puede tener el permiso"

- **Decision**: nueva función `canHoldApprovalPermission(role)` en `core/auth/permissions.ts`
  (`isAdmin(role) || isEditor(role)`), con test en `permissions.spec.ts`.
- **Rationale**: RUT-02 prohíbe comparar `role === 'READER'` fuera de `permissions.ts`.
- **Alternatives considered**: comparar el rol en el componente; viola RUT-02.

## R8. Casilla: control nativo o `mat-checkbox`

- **Decision**: `<input type="checkbox" formControlName="canApprove">` nativo dentro de un
  `<label>` con forma de tarjeta, estilado con tokens (`accent-color: var(--color-primary)`).
- **Rationale**: el diseño dibuja una tarjeta con casilla, título y texto de ayuda; el único
  checkbox existente en el proyecto (`category-form-dialog`) es nativo. El `<label>` envuelve el
  control (UI-10) y el texto de ayuda se enlaza con `aria-describedby` (FR-016).
- **Alternatives considered**: `MatCheckboxModule`; añade un estilo distinto al del resto del
  formulario, que usa controles nativos (`field__input`, `field__select`).

## R9. Etiqueta "Aprobador" en el listado

- **Decision**:
  - Nuevo componente presentacional `app-approver-badge` en `features/users/user-list/components/`
    (plantilla inline, ≤ 40 líneas, CMP-08) con input `inactive`. Envuelve `app-badge` con icono
    `verified` y texto "Aprobador".
  - `BadgeComponent` gana la variante `accent` (tokens `--color-purple-light` / `--color-purple-text`,
    ya existentes). Si está inactivo, usa la variante `neutral`.
  - Para el inactivo, la explicación va como texto visualmente oculto dentro de la etiqueta
    ("Inactivo: no cuenta como aprobador activo") más `matTooltip` para ratón. Así la leen los
    lectores de pantalla sin depender del hover (FR-016). Verificar en la implementación que la
    clase `cdk-visually-hidden` está disponible con los estilos de Material cargados; si no, se usa
    una utilidad propia en `src/styles/`.
  - Tabla: junto al nombre, mediante un `<ng-content>` nuevo en `app-user-identity`. Tarjetas:
    junto a las etiquetas de rol y estado.
- **Rationale**: reutiliza el badge compartido y los tokens morados que el diseño usa para
  "Aprobador". Una variante con nombre genérico (`accent`) evita meter lógica de negocio en
  `shared/`.
- **Alternatives considered**: un token nuevo `--color-purple-border` para el borde del diseño; no
  es necesario porque `app-badge` no dibuja borde. Si la revisión visual lo pide, se añade según
  `src/styles/README.md`.

## R10. Diálogo de activar/desactivar

- **Decision**: `ToggleStatusDialogComponent` añade un `computed` `approverNote` que, solo si
  `data.user.canApprove`, muestra un párrafo más:
  - desactivar: "Dejará de contar como aprobador activo de documentos."
  - activar: "Conserva el permiso para aprobar documentos y vuelve a contar como aprobador activo."
- **Rationale**: FR-013 con el mínimo cambio (la spec deja fuera el rediseño del diálogo).
- **Alternatives considered**: el rediseño completo del hand off; fuera de alcance.

## R11. i18n

- **Decision**: IDs nuevos con el ámbito existente:
  `@@users.form.approval.section`, `@@users.form.approval.label`, `@@users.form.approval.hintAdmin`,
  `@@users.form.approval.hintEditor`, `@@users.form.approval.hintReader`,
  `@@users.form.approval.hintSelf`, `@@users.form.approval.revokeTitle`,
  `@@users.form.approval.revokeBody`, `@@users.toast.updated.approvalRevoked`,
  `@@users.list.approverBadge`, `@@users.list.approverInactive`,
  `@@users.toggle.approverDeactivate`, `@@users.toggle.approverActivate`.
  El aviso interpola el nombre con un placeholder (`{{ name }}` en plantilla). La pista para
  lectores lleva punto final ("Los lectores no pueden aprobar documentos.", CAL-01); el mensaje del
  backend se muestra tal como llega.
- **Rationale**: CAL-02; `npm run extract-i18n` y `messages.en.xlf` actualizados (definición de
  terminado).

## R12. Pruebas

- **Decision**:
  - Unitarias (Vitest, patrón zoneless): `permissions.spec.ts` (nueva función); nuevo
    `user-form-dialog.component.spec.ts` (casilla por defecto, READER, recuperar valor, aviso,
    autoedición y payloads de crear/editar, toast de retirada, 400 con mensaje);
    `toggle-status-dialog.component.spec.ts` (nota solo para aprobadores);
    `user-list.component.spec.ts` (etiqueta activa, atenuada y ausente); spec del
    `approver-badge`.
  - E2E: el fixture `/users` añade `canApprove` (un aprobador activo y uno inactivo). La captura
    `users` cambia de forma intencionada: se regenera en Windows con
    `npm run e2e -- --update-snapshots`.
- **Rationale**: CAL-07 y CAL-08; los umbrales de cobertura solo pueden subir.
