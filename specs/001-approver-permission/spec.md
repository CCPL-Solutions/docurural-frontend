# Feature Specification: Permiso para aprobar documentos (HU-32)

**Feature Branch**: `feature/hu-32`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "HU-32 — Permiso para aprobar documentos (RF-07, prioridad Alta, v2.0 — Flujo de aprobación). Como administrador del sistema, quiero indicar qué usuarios pueden revisar y aprobar documentos, para que la responsabilidad de aprobar recaiga solo en las personas autorizadas por la institución, como la rectoría o la coordinación. Incluye el hand off de Claude Design del proyecto `Users.html` (secciones HU-32)."

## Clarifications

### Session 2026-09-23

- Q: ¿Un ADMIN puede concederse o retirarse a sí mismo el permiso en la autoedición? → A: No. En
  la autoedición la casilla queda bloqueada, como el rol; el permiso de un ADMIN solo lo cambia
  otro ADMIN.
- Q: Si se cambia el rol de un aprobador a Lector y, sin guardar, se vuelve a Editor o
  Administrador, ¿la casilla recupera su valor o queda desmarcada? → A: Recupera el valor que tenía
  antes de pasar a Lector.
- Q: ¿De dónde sale el número de "aprobadores activos" de la cabecera del listado? → A: El
  contador sale de esta HU y queda para otra; aquí solo se muestra la etiqueta "Aprobador".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conceder o retirar el permiso al editar un usuario (Priority: P1)

Un administrador abre la edición de un usuario ADMIN o EDITOR (HU-04). En el bloque "Aprobación de
documentos" marca o desmarca la casilla "Puede aprobar documentos" y guarda. A partir de ese momento
el usuario puede (o deja de poder) aprobar documentos.

**Why this priority**: es el núcleo de la HU. Sin poder conceder el permiso a los usuarios que ya
existen, el flujo de aprobación (v2.0) no tiene aprobadores.

**Independent Test**: editar un EDITOR sin permiso, marcar la casilla, guardar y volver a abrir la
edición: la casilla aparece marcada. Desmarcarla, guardar y comprobar que aparece desmarcada.

**Acceptance Scenarios**:

1. **Given** un administrador edita a un usuario EDITOR sin el permiso, **When** marca "Puede
   aprobar documentos" y guarda, **Then** el cambio se guarda, se confirma con el aviso de éxito
   habitual y al reabrir la edición la casilla aparece marcada.
2. **Given** un administrador edita a otro usuario ADMIN con el permiso, **When** desmarca la
   casilla y guarda, **Then** el usuario sigue siendo ADMIN pero ya no tiene el permiso de aprobar.
3. **Given** un administrador edita a un usuario con rol ADMIN seleccionado, **When** se muestra la
   casilla, **Then** la acompaña el texto "El rol Administrador no incluye este permiso: márquelo
   solo si esta persona debe aprobar."
4. **Given** un administrador edita a un usuario con rol EDITOR seleccionado, **When** se muestra
   la casilla, **Then** la acompaña el texto "Podrá revisar y aprobar los documentos enviados a
   aprobación."
5. **Given** un administrador se edita a sí mismo, **When** abre el formulario, **Then** la casilla
   muestra su valor actual, pero deshabilitada y con una explicación de que no puede cambiar su
   propio permiso de aprobación; al guardar, su permiso no cambia.

---

### User Story 2 - Conceder el permiso al crear un usuario (Priority: P1)

Al crear un usuario (HU-03), el administrador ve la casilla "Puede aprobar documentos" desmarcada
por defecto y puede marcarla si el rol elegido es ADMIN o EDITOR.

**Why this priority**: evita tener que crear y luego editar a la persona de rectoría o coordinación.

**Independent Test**: crear un EDITOR con la casilla marcada y comprobar en el listado que muestra
la etiqueta "Aprobador".

**Acceptance Scenarios**:

1. **Given** un administrador abre el formulario de creación, **When** el formulario se muestra,
   **Then** la casilla "Puede aprobar documentos" aparece desmarcada.
2. **Given** un administrador crea un usuario ADMIN o EDITOR con la casilla marcada, **When**
   guarda, **Then** el usuario se crea con el permiso de aprobar.
3. **Given** un administrador crea un usuario sin tocar la casilla, **When** guarda, **Then** el
   usuario se crea sin el permiso.

---

### User Story 3 - Impedir el permiso a los lectores (Priority: P1)

El permiso solo puede asignarse a usuarios ADMIN o EDITOR. Cuando el rol seleccionado es READER, la
casilla aparece deshabilitada con el texto "Los lectores no pueden aprobar documentos.". Si a un
usuario con el permiso se le cambia el rol a READER, la casilla se desmarca y el formulario avisa
al administrador antes de guardar.

**Why this priority**: es la regla de negocio que protege la integridad del flujo; sin ella podría
quedar un lector con capacidad de aprobar.

**Independent Test**: editar un EDITOR con permiso, cambiar el rol a READER y comprobar que la
casilla queda desmarcada y deshabilitada, que aparece el aviso y que, tras guardar, el usuario ya no
tiene el permiso y el aviso de éxito lo menciona.

**Acceptance Scenarios**:

1. **Given** el formulario (creación o edición) tiene el rol READER seleccionado, **When** se
   muestra la casilla, **Then** aparece desmarcada, deshabilitada y con el texto "Los lectores no
   pueden aprobar documentos.".
2. **Given** un administrador edita a un usuario que tenía el permiso, **When** cambia el rol a
   READER, **Then** la casilla se desmarca y bloquea, y bajo ella aparece el aviso "Se retirará el
   permiso de aprobación. Al cambiar el rol a Lector, [nombre] dejará de poder aprobar documentos
   cuando guarde los cambios."
3. **Given** el caso anterior, **When** el administrador vuelve a seleccionar ADMIN o EDITOR antes
   de guardar, **Then** la casilla vuelve a estar habilitada y marcada (recupera el valor que tenía
   antes de pasar a Lector) y el aviso desaparece.
4. **Given** el caso del escenario 2, **When** el administrador guarda con el rol READER, **Then**
   el usuario queda como READER y sin el permiso, y el aviso de éxito dice "Usuario actualizado. Se
   retiró el permiso para aprobar documentos."
5. **Given** un usuario READER, **When** un administrador cambia su rol a EDITOR, **Then** la
   casilla pasa a estar habilitada y desmarcada, sin aviso.
6. **Given** un usuario sin el permiso (o en creación), **When** se selecciona READER, **Then** no
   aparece el aviso de retirada, porque no hay permiso que retirar.

---

### User Story 4 - Identificar a los aprobadores en el listado (Priority: P2)

En el listado de usuarios (HU-08), los usuarios con el permiso muestran la etiqueta "Aprobador", de
forma que el administrador sabe de un vistazo quién puede aprobar.

**Why this priority**: da visibilidad y permite comprobar que la institución tiene aprobadores,
pero el permiso funciona sin ella.

**Independent Test**: con un aprobador activo, un aprobador inactivo y un usuario sin permiso, abrir
el listado y comprobar que el primero muestra la etiqueta, el segundo la muestra atenuada y el
tercero no la muestra.

**Acceptance Scenarios**:

1. **Given** un usuario activo con el permiso, **When** el administrador abre el listado, **Then**
   junto a su nombre aparece la etiqueta "Aprobador".
2. **Given** un usuario sin el permiso, **When** el administrador abre el listado, **Then** no
   muestra la etiqueta.
3. **Given** un usuario inactivo con el permiso, **When** el administrador abre el listado,
   **Then** la etiqueta "Aprobador" aparece atenuada y explica que, por estar inactivo, no cuenta
   como aprobador activo.
4. **Given** el listado en pantalla estrecha (vista en tarjetas), **When** se muestra un usuario
   con el permiso, **Then** la etiqueta aparece junto a las de rol y estado.

---

### User Story 5 - Informar del efecto al desactivar o reactivar a un aprobador (Priority: P3)

Al desactivar a un aprobador (HU-05), la confirmación indica que dejará de contar como aprobador
activo. Al reactivarlo, indica que conserva el permiso y vuelve a contar como aprobador activo.

**Why this priority**: evita sorpresas sobre el efecto en el flujo de aprobación, pero no cambia el
comportamiento de la desactivación.

**Independent Test**: abrir la confirmación de desactivar para un aprobador y para un usuario sin
permiso, y comprobar que el texto extra solo aparece en el primer caso.

**Acceptance Scenarios**:

1. **Given** un aprobador activo, **When** el administrador abre la confirmación de desactivarlo,
   **Then** se indica que dejará de contar como aprobador activo de documentos.
2. **Given** un aprobador inactivo, **When** el administrador abre la confirmación de reactivarlo,
   **Then** se indica que conserva el permiso para aprobar documentos y vuelve a contar como
   aprobador activo.
3. **Given** un usuario sin el permiso, **When** se abre cualquiera de las dos confirmaciones,
   **Then** no aparece ningún texto sobre aprobación.
4. **Given** un aprobador, **When** se desactiva y se reactiva, **Then** conserva el permiso y su
   etiqueta vuelve a mostrarse sin atenuar.

---

### Edge Cases

- **Autoedición del administrador**: la casilla se muestra deshabilitada con su valor actual y una
  explicación; el guardado no altera el permiso propio. (Resuelto en Clarifications.)
- **Autoedición con rol bloqueado**: como el rol propio tampoco puede cambiarse, en la autoedición
  nunca aparece el aviso de retirada.
- **Guardando**: mientras se guarda, la casilla queda bloqueada como el resto del formulario.
- **Error al guardar**: si el guardado falla, el formulario conserva el valor de la casilla y el
  aviso de retirada (si aplica); el error se comunica como el resto de errores del formulario.
- **Rechazo del servidor**: si el servidor rechaza la combinación READER + permiso, se muestra su
  mensaje de error y no se guarda nada.
- **Propio permiso en el servidor**: el servidor no rechaza hoy que un ADMIN cambie su propio
  permiso. El formulario lo evita no enviando el permiso en la autoedición (el servidor conserva el
  valor); el rechazo en el servidor queda como seguimiento de `docurural-backend`.
- **Usuarios existentes antes de la HU**: todos aparecen sin el permiso hasta que un administrador
  lo conceda.
- **Retirada con vistos buenos previos**: retirar el permiso no altera los vistos buenos ya
  registrados; la interfaz no pide confirmación adicional por ello.

## Requirements *(mandatory)*

### Functional Requirements

**Formulario de usuario (crear y editar)**

- **FR-001**: Los formularios de creación y edición DEBEN incluir un bloque "Aprobación de
  documentos" con la casilla "Puede aprobar documentos", desmarcada por defecto en la creación y
  con el valor guardado en la edición.
- **FR-002**: El rol ADMIN NO DEBE otorgar el permiso implícitamente; el permiso depende únicamente
  del valor de la casilla.
- **FR-003**: La casilla DEBE ir acompañada de un texto de ayuda según el rol seleccionado: para
  ADMIN, "El rol Administrador no incluye este permiso: márquelo solo si esta persona debe
  aprobar."; para EDITOR, "Podrá revisar y aprobar los documentos enviados a aprobación."; para
  READER, "Los lectores no pueden aprobar documentos." (con punto final, CAL-01).
- **FR-004**: Con el rol READER seleccionado, la casilla DEBE aparecer desmarcada y deshabilitada.
- **FR-005**: Al cambiar a READER el rol de un usuario que tenía el permiso guardado, el formulario
  DEBE mostrar, antes de guardar, el aviso "Se retirará el permiso de aprobación. Al cambiar el rol
  a Lector, [nombre] dejará de poder aprobar documentos cuando guarde los cambios."
- **FR-006**: Si se vuelve a ADMIN o EDITOR antes de guardar, la casilla DEBE volver a habilitarse
  con el valor que tenía antes de pasar a READER, y el aviso DEBE desaparecer. Solo se descarta el
  permiso si se guarda con el rol READER.
- **FR-007**: Tras guardar un cambio a READER que retira el permiso, el aviso de éxito DEBE ser
  "Usuario actualizado. Se retiró el permiso para aprobar documentos."; en el resto de casos se
  mantienen los avisos de éxito actuales.
- **FR-008**: En la autoedición, la casilla DEBE mostrarse deshabilitada con su valor actual y una
  explicación de que el administrador no puede cambiar su propio permiso de aprobación.
- **FR-009**: Al crear y al editar, el sistema DEBE enviar el valor del permiso, y NUNCA como
  concedido para un usuario READER.

**Listado de usuarios**

- **FR-010**: El listado DEBE mostrar la etiqueta "Aprobador" junto al nombre de los usuarios con
  el permiso, en la vista de tabla y en la de tarjetas.
- **FR-011**: En los usuarios inactivos con el permiso, la etiqueta DEBE mostrarse atenuada y
  explicar que no cuentan como aprobadores activos.
- **FR-012**: La cabecera del listado NO DEBE mostrar en esta HU un recuento de aprobadores
  activos; el contador que muestra el diseño queda para otra HU.

**Activar y desactivar**

- **FR-013**: La confirmación de desactivar a un aprobador DEBE indicar que dejará de contar como
  aprobador activo; la de reactivarlo, que conserva el permiso y vuelve a contar como aprobador
  activo. Para usuarios sin el permiso no se añade texto.
- **FR-014**: Activar o desactivar un usuario NO DEBE modificar su permiso de aprobar.

**Transversales**

- **FR-015**: Todos los textos nuevos DEBEN estar disponibles en español y en inglés y tratar al
  usuario de usted.
- **FR-016**: La casilla, su texto de ayuda y el aviso DEBEN ser accesibles: la casilla asociada a
  su etiqueta, el texto de ayuda vinculado a la casilla, el aviso anunciado a las tecnologías de
  apoyo cuando aparece y la etiqueta "Aprobador" con su explicación accesible también sin ratón.
- **FR-017**: La interfaz NO DEBE deducir el permiso de aprobar a partir de datos de la sesión del
  usuario conectado; el permiso efectivo lo decide el servidor en cada aprobación o devolución.

### Key Entities *(include if feature involves data)*

- **Usuario**: persona con acceso al sistema. Se añade el atributo **puede aprobar documentos**
  (sí/no, "no" por defecto), independiente del rol pero solo "sí" si el rol es ADMIN o EDITOR, y
  que se conserva al desactivar y reactivar al usuario.
- **Aprobador activo**: usuario activo con el permiso. Es un concepto derivado que se comunica con
  la etiqueta (atenuada si el usuario está inactivo) y en las confirmaciones de activar/desactivar.
- **Registro de actividad**: el cambio del permiso se registra como una edición de usuario con el
  valor anterior y el nuevo (responsabilidad del servidor).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador concede o retira el permiso de aprobar a un usuario existente en
  menos de 30 segundos y en un solo formulario.
- **SC-002**: El 100 % de los intentos de conceder el permiso a un usuario READER, o de cambiar el
  propio permiso, se impiden desde el formulario, sin necesidad de un error del servidor.
- **SC-003**: En el 100 % de los cambios de rol a READER de un aprobador, el administrador ve el
  aviso de retirada antes de guardar.
- **SC-004**: Un administrador identifica a todos los aprobadores de cada página del listado, y si
  están activos, sin abrir ningún formulario.
- **SC-005**: Todos los textos nuevos aparecen traducidos en la versión en inglés, sin textos en
  español sueltos.

## Assumptions

- **Alcance de este repositorio**: el frontend cubre los criterios 1–6 de la HU y lo que añade el
  diseño. El campo en base de datos, la validación en cada aprobación o devolución (sin incluir el
  permiso en el token), el rechazo de READER + permiso y del cambio del propio permiso, la
  conservación de los vistos buenos previos (criterio 7) y el registro en el historial de actividad
  con `EDIT_USER` y `can_approve: anterior → nuevo` (criterio 8) son responsabilidad de
  `docurural-backend`.
- **Dependencia del backend**: la API de usuarios expone el permiso en el listado, la creación y la
  edición (peticiones y respuestas) con el campo booleano `canApprove` (ver
  `contracts/users-api.md`).
- **Diseño**: la apariencia sigue el hand off de Claude Design (`Users.html`, secciones HU-32:
  artboards 4.1–4.9 y el prototipo interactivo), adaptada a los componentes y tokens del proyecto.
  El diseño no contempla el bloqueo en la autoedición; se aplica la decisión de Clarifications con
  el mismo patrón de explicación que ya usa el campo Rol.
- **Diálogo de activar/desactivar**: se añade una línea sobre la aprobación al diálogo actual; el
  rediseño completo de ese diálogo que muestra el hand off (ficha del usuario y lista de
  consecuencias) queda fuera de alcance.
- **Filtros y contador**: esta HU no añade un filtro por aprobadores al listado ni el contador de
  aprobadores activos de la cabecera (artboards de HU-08); ambos quedan para otra HU.
- **Flujo de aprobación**: las pantallas de aprobar o devolver documentos pertenecen a otras HU de
  la v2.0 y quedan fuera de alcance.
