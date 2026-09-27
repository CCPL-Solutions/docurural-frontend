# Research: Configuración de aprobación por categoría (HU-31)

Fase 0 del plan. Resuelve las incógnitas del contexto técnico con el código actual del frontend,
el contrato ya implementado en `docurural-backend` (rama `feature/hu-31`, commit `768b5bb`,
`specs/002-category-approval-config/contracts/categories-api.md`) y el hand off de Claude Design
(`Categories.html`, `sensitivity-cats.jsx`: `ApprovalField`, `ApprovalValue`, `ApproverWarning`,
`ApprovalScopeToast`, `Hu31EditActivate`, `Hu31SavedNotice`).

## R1. Nombre y forma del campo en la API

- **Decision**: el campo es `requiresApproval: boolean`. Aparece siempre en las respuestas de
  `GET /api/categories`, `POST` (201) y `PUT /api/categories/{id}` (200). En las peticiones es
  opcional para el backend, pero el frontend lo envía **siempre** (FR-007), también cuando no
  cambia: enviar el mismo valor equivale a omitirlo (sin aviso ni bitácora).
- **Rationale**: es el contrato que el backend ya implementó. Enviarlo siempre simplifica el tipo
  (`requiresApproval: boolean`, no opcional) y el formulario, sin efectos secundarios.
- **Alternatives considered**: omitirlo cuando no cambia; se descarta porque el resultado es el
  mismo y añade una rama sin valor.

## R2. `approvalScopeNotice` y `approverWarning` de la respuesta

- **Decision**: el frontend no los lee ni los declara en sus tipos de respuesta. Los textos de los
  avisos salen de `$localize` (FR-008).
- **Rationale**: los textos del servidor solo están en español y la interfaz tiene build en inglés
  (CAL-02). Además, la advertencia de aprobadores se muestra antes de guardar (FR-004), cuando aún
  no hay respuesta.
- **Alternatives considered**: usar la presencia de `approvalScopeNotice` como disparador del aviso
  de alcance; se descarta porque la condición equivalente (R4) se calcula con datos que el
  frontend ya tiene y no ata la interfaz a un campo de presentación del backend.

## R3. Recuento de aprobadores activos (FR-004, FR-005)

- **Decision**: `UsersService.list()` (ya existente, `GET /api/users`, sin paginación) y una
  función `isActiveApprover(user)` en `core/auth/permissions.ts`:
  `user.status === 'ACTIVE' && user.canApprove && canHoldApprovalPermission(user.role)`. El
  formulario guarda el recuento en un signal `activeApprovers: number | null` (`null` = aún no se
  sabe o la consulta falló).
- **Cuándo se consulta**: en `ngOnInit`, solo si una activación es posible, es decir, en la
  creación o en la edición de una categoría con `requiresApproval = false`. Si la categoría ya
  requiere aprobación, no se consulta (FR-004: no hay activación nueva).
- **Fallo**: el error se ignora sin toast; `activeApprovers` queda en `null` y la advertencia no se
  muestra (Edge Cases). No se usa `notifications.httpError` porque la advertencia es opcional y un
  toast de error confundiría en un formulario que funciona.
- **Rationale**: la pantalla de categorías es exclusiva del ADMIN, que ya puede listar usuarios; la
  misma definición de "aprobador activo" que el backend (`countActiveApprovers`, HU-32) evita
  discrepancias. RUT-02 exige que la comparación de rol viva en `permissions.ts`.
- **Alternatives considered**: consultar al activar el interruptor (la advertencia aparecería con
  retraso y habría que cancelar peticiones si se alterna rápido); endpoint nuevo de recuento
  (el backend no lo expone y la HU no lo pide).

## R4. Condiciones de los avisos

- **Advertencia de aprobadores** (antes de guardar, en el formulario):
  `requiresApprovalValue() && !originalRequiresApproval && activeApprovers() !== null &&
  activeApprovers() < 2`, donde `originalRequiresApproval` es `false` en la creación.
- **Aviso de alcance** (tras guardar, solo en la edición):
  `res.requiresApproval !== data.category.requiresApproval`. Usa el valor que devuelve el servidor,
  que es el guardado de verdad. Equivale al "valor enviado" de FR-003, porque el frontend siempre
  envía el campo (R1) y el servidor guarda lo que recibe; si alguna vez difirieran, manda lo
  guardado.
- **Rationale**: son las mismas condiciones que usa el backend para `approverWarning` y
  `approvalScopeNotice` (contrato, tabla de `PUT`), calculadas en el cliente.

## R5. Dos toasts seguidos (Clarifications, respuesta B)

- **Hallazgo**: `NotificationService.show()` llama a `snackBar.dismiss()` antes de abrir cada toast,
  así que `success()` seguido de `info()` hace que el toast de éxito desaparezca al instante y solo
  se vea el segundo. La respuesta B no se cumple con el servicio actual.
- **Decision**: añadir a `NotificationService` una opción para **encolar** un toast detrás del
  visible: `info(title, description?, options?: { queue?: boolean })` (y el mismo parámetro en
  `success`, `warning` y `error`, que comparten `show`). Con `queue: true`, si hay un toast
  abierto, el nuevo se abre cuando aquel se cierra (`afterDismissed`); si no hay ninguno, se abre
  enseguida. Sin la opción, el comportamiento actual no cambia. Un toast sin `queue` descarta los
  toasts encolados pendientes (no se muestran) y se abre enseguida, como hoy. Así un aviso nuevo,
  por ejemplo un error, nunca queda tapado por un aviso de alcance que llega tarde.
- **Efecto**: el toast de éxito se ve sus 5 s habituales (o hasta que el usuario lo cierra) y a
  continuación aparece el de alcance.
- **Rationale**: API-08 exige que `NotificationService` sea el único mecanismo de toasts; una
  opción explícita no altera los avisos existentes (el reemplazo evita avisos apilados en errores
  repetidos, R1).
- **Alternatives considered**: cambiar el servicio a una cola global (cambia todos los avisos de la
  app); un único toast combinado (contradice la respuesta B); un `setTimeout` en el formulario
  (frágil y el diálogo ya está cerrado).

## R6. Título del aviso de alcance

- **Decision**: toast `info` con título según el nuevo valor, "Aprobación activada" o "Aprobación
  desactivada", y como descripción "Este cambio solo afecta a los documentos que se carguen desde
  ahora. Los documentos existentes conservan su estado actual."
- **Rationale**: el diseño lo titula "Cambios guardados" porque es el único toast; aquí va detrás
  del de éxito y repetirlo sería redundante (spec, Assumptions). Un título que dice qué cambió da
  contexto al texto de alcance.

## R7. Control del interruptor

- **Decision**: `MatSlideToggle` de Angular Material (`@angular/material/slide-toggle`, ya
  instalado) con `formControlName="requiresApproval"` y `hideIcon`, estilado con sus variables CSS
  (`--mat-slide-toggle-*`, comprobadas en `@angular/material` 21) apuntando a tokens `--color-*` en
  `_material-overrides.scss` (clase `.app-switch`). El texto "Sí"/"No" del diseño va al lado, con
  `aria-hidden="true"`, porque el estado ya lo anuncia `role="switch"` + `aria-checked` (FR-013).
  La etiqueta "Requiere aprobación" y la ayuda se asocian con `aria-labelledby` y
  `aria-describedby`.
- **Rationale**: no añade librerías (restricción técnica), trae la semántica de interruptor
  accesible (teclado, `role="switch"`) y funciona con Reactive Forms (FRM-01). El diseño pide
  expresamente un interruptor, no una casilla.
- **Alternatives considered**: `<input type="checkbox" role="switch">` con CSS propio (más CSS para
  reproducir foco, deshabilitado y movimiento); la casilla de HU-32 (no es lo que muestra el
  diseño).
- **A verificar en la implementación**: el tamaño del diseño (40 × 22) se aproxima con las
  variables de tamaño del slide toggle si Material lo permite, sin literales fuera de tokens; si
  no, se acepta el tamaño de Material con los colores del sistema.

## R8. Presentación en el listado

- **Decision**: componente presentacional nuevo `app-category-approval-badge` (plantilla inline,
  `input.required<boolean>() requiresApproval`, `input<'md' | 'sm'>() size`) sobre `app-badge`:
  - Tabla (`md`): "Sí" con variante `primary`, "No" con variante `neutral`.
  - Tarjetas (`sm`): icono y "Aprobación: Sí" / "Aprobación: No".
  - Categoría inactiva: variante `neutral` también para "Sí" (atenuada, FR-011), como el resto de
    la fila; recibe `[muted]`.
- **Columna**: nueva `<col class="col-approval">` entre sensibilidad y documentos, con ancho fijo.
  Hoy los porcentajes suman el 50 % y las fijas 460 px (comentario del SCSS); con otra columna fija
  hay que rebajar los porcentajes para que la tabla quepa a 1280 px con el menú lateral. Se valida
  con la captura E2E `categories-desktop`.
- **Icono**: el diseño usa `stamp` (Lucide); con Material Symbols se usa `approval`
  (equivalente más cercano), `aria-hidden`.
- **Rationale**: sigue el patrón de `app-category-status-badge` y `app-sensitivity-badge`; el
  componente vive en la feature (ARQ-01) porque solo lo usa `categories`.

## R9. Tamaño de letra (UI-08)

- **Decision**: la etiqueta del interruptor, su ayuda y la advertencia usan `--text-base` (16 px),
  como el bloque de aprobación de HU-32. No se reutilizan las clases `field__hint` ni
  `level-banner__text` (14 px, deuda UI-08). Solo las etiquetas del listado (badges) usan tokens
  menores.
- **Advertencia**: `<app-alert variant="warning">` (UI, `role="alert"`), como el aviso de retirada
  de HU-32.

## R10. Error 403

- **Decision**: se mantiene el manejo actual del 403 del formulario (textos propios en usted).
  La spec (FR-014) pide mostrar el error "como el resto de errores del formulario"; el texto del
  backend no se traduce (CAL-02) y el mensaje propio ya cubre el caso.
- **Rationale**: la pantalla es exclusiva del ADMIN, así que el 403 por rol es teórico.

## R11. Pruebas

- **Decision**:
  - `permissions.spec.ts`: casos de `isActiveApprover` (activo/inactivo, con/sin permiso, READER).
  - `notification.service.spec.ts`: la opción `queue` abre tras cerrar el visible, y abre enseguida
    si no hay ninguno.
  - `category-form-dialog.component.spec.ts` (**nuevo**, hoy no existe): valor por defecto,
    precarga, envío de `requiresApproval`, advertencia (< 2, ≥ 2, error de la consulta, categoría
    ya activa, sin consulta), toasts tras guardar (con y sin cambio, creación).
  - `category-approval-badge.component.spec.ts` (nuevo) y `category-list.component.spec.ts`
    (columna y tarjeta).
  - E2E: `requiresApproval` en el fixture de `/categories` y captura `categories` regenerada
    (Windows).
- **Rationale**: CAL-07 y los umbrales de cobertura (solo suben).
