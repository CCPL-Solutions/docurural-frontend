# Feature Specification: Configuración de aprobación por categoría (HU-31)

**Feature Branch**: `feature/hu-31`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "HU-31 — Configuración de aprobación por categoría (RF-07, prioridad
Alta, v2.0 — Flujo de aprobación). Como administrador del sistema, quiero indicar qué categorías
documentales requieren aprobación, para que solo los documentos que lo necesitan pasen por el flujo,
sin agregar pasos a los demás. Incluye el hand off de Claude Design del proyecto `Categories.html`.
El backend ya está implementado; los avisos `approvalScopeNotice` y `approverWarning` que devuelve la
API al crear o editar son solo del backend: el frontend debe mostrar esa información en el
formulario antes de guardar, y para la advertencia de aprobadores debe consultar los usuarios desde
el frontend."

## Clarifications

### Session 2026-09-27

- Q: ¿Dónde se muestra el aviso de alcance ("Este cambio solo afecta a los documentos que se carguen
  desde ahora…")? → A: Como en el diseño: tras guardar, en un aviso emergente (toast) informativo,
  no en el formulario. (Corrige la indicación inicial de mostrarlo antes de guardar.)
- Q: Al guardar una edición que cambia "Requiere aprobación", ¿el aviso de alcance sustituye al
  toast de éxito habitual o se muestra además de él? → A: Además: primero el toast de éxito
  habitual y después un toast informativo con el texto de alcance.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Activar o desactivar la aprobación al editar una categoría (Priority: P1)

Un administrador abre la edición de una categoría (HU-17). En el formulario encuentra el interruptor
"Requiere aprobación" con el valor guardado, lo cambia y guarda. Tras guardar, el sistema le informa
de que el cambio solo afecta a los documentos que se carguen desde ahora.

**Why this priority**: es el núcleo de la HU. Las 8 categorías existentes quedan sin aprobación tras
la migración; sin poder editarlas, el administrador no puede activar el flujo en Actas o
Resoluciones.

**Independent Test**: editar una categoría con el interruptor en No, activarlo, guardar, comprobar
que aparecen el aviso de éxito y el aviso de alcance, y reabrir la edición: el interruptor aparece en
Sí.

**Acceptance Scenarios**:

1. **Given** un administrador edita una categoría activa, **When** se abre el formulario, **Then**
   el interruptor "Requiere aprobación" muestra el valor guardado de la categoría.
2. **Given** el formulario de edición abierto, **When** el administrador cambia el interruptor
   respecto al valor guardado, **Then** el formulario no muestra ningún aviso de alcance antes de
   guardar.
3. **Given** el administrador cambió el interruptor, **When** guarda, **Then** la categoría queda con
   el nuevo valor, el listado lo refleja, aparece el aviso de éxito habitual y, además, un aviso
   informativo con el texto "Este cambio solo afecta a los documentos que se carguen desde ahora.
   Los documentos existentes conservan su estado actual."
4. **Given** el administrador cambió el interruptor y lo devolvió a su valor guardado, **When**
   guarda, **Then** solo aparece el aviso de éxito habitual, sin el aviso de alcance.
5. **Given** el administrador no tocó el interruptor, **When** guarda otros cambios, **Then** el
   valor de "Requiere aprobación" no cambia y solo aparece el aviso de éxito habitual.
6. **Given** una categoría con documentos en Borrador o En revisión, **When** el administrador
   desactiva la aprobación y guarda, **Then** esos documentos no cambian de estado (el formulario no
   pide confirmación adicional por ello; el aviso de alcance ya lo explica).

---

### User Story 2 - Elegir la aprobación al crear una categoría (Priority: P1)

Al crear una categoría (HU-16), el administrador ve el interruptor "Requiere aprobación" en No por
defecto y puede activarlo antes de guardar.

**Why this priority**: evita crear una categoría y luego tener que editarla para activar el flujo.

**Independent Test**: crear una categoría con el interruptor activado y comprobar en el listado que
muestra "Sí"; crear otra sin tocarlo y comprobar que muestra "No".

**Acceptance Scenarios**:

1. **Given** un administrador abre el formulario de creación, **When** el formulario se muestra,
   **Then** el interruptor "Requiere aprobación" está en No.
2. **Given** el formulario de creación, **When** el administrador activa el interruptor y guarda,
   **Then** la categoría se crea con la aprobación activada.
3. **Given** el formulario de creación, **When** el administrador guarda sin tocar el interruptor,
   **Then** la categoría se crea sin aprobación.
4. **Given** el formulario de creación, **When** el administrador guarda con el interruptor
   activado, **Then** solo aparece el aviso de éxito de creación, sin el aviso de alcance, porque una
   categoría nueva no tiene documentos existentes.

---

### User Story 3 - Advertir cuando hay pocos aprobadores (Priority: P2)

Al activar el interruptor (en creación o en edición), si en el sistema hay menos de dos usuarios
activos con permiso de aprobar, el formulario muestra una advertencia no bloqueante: el
administrador puede guardar igualmente.

**Why this priority**: evita que una categoría quede con un flujo que, en la práctica, no se puede
completar (un aprobador no aprueba sus propios documentos), pero la configuración funciona sin ella.

**Independent Test**: con un solo aprobador activo, activar el interruptor y comprobar que aparece
la advertencia y que se puede guardar; con dos o más aprobadores activos, comprobar que no aparece.

**Acceptance Scenarios**:

1. **Given** hay menos de dos usuarios activos con permiso de aprobar, **When** el administrador
   activa el interruptor (y en edición el valor guardado era No), **Then** aparece, antes de
   guardar, la advertencia "Hay menos de dos usuarios con permiso de aprobar. Los documentos que
   cargue un aprobador no podrán ser aprobados por él mismo."
2. **Given** la advertencia visible, **When** el administrador guarda, **Then** la categoría se
   guarda con normalidad; la advertencia no impide la acción.
3. **Given** hay dos o más usuarios activos con permiso de aprobar, **When** el administrador activa
   el interruptor, **Then** no aparece la advertencia.
4. **Given** la advertencia visible, **When** el administrador desactiva el interruptor, **Then** la
   advertencia desaparece.
5. **Given** una categoría que ya tenía la aprobación activada, **When** se abre su edición sin
   cambiar el interruptor, **Then** no aparece la advertencia (no hay activación nueva).

---

### User Story 4 - Ver qué categorías requieren aprobación en el listado (Priority: P2)

En el listado de categorías (HU-19), una columna "Requiere aprobación" indica "Sí" o "No" en cada
categoría, de modo que el administrador sabe de un vistazo cuáles pasan por el flujo.

**Why this priority**: da visibilidad y permite comprobar la configuración sin abrir cada
categoría, pero la configuración funciona sin ella.

**Independent Test**: con una categoría con aprobación y otra sin ella, abrir el listado y comprobar
que muestran "Sí" y "No" respectivamente, en la vista de tabla y en la de tarjetas.

**Acceptance Scenarios**:

1. **Given** una categoría con la aprobación activada, **When** el administrador abre el listado,
   **Then** la columna "Requiere aprobación" muestra "Sí".
2. **Given** una categoría sin aprobación, **When** el administrador abre el listado, **Then** la
   columna muestra "No".
3. **Given** el listado en pantalla estrecha (vista en tarjetas), **When** se muestra una categoría,
   **Then** aparece la etiqueta "Aprobación: Sí" o "Aprobación: No" junto a las de estado y
   sensibilidad.
4. **Given** una categoría inactiva, **When** se muestra en el listado, **Then** conserva y muestra
   su valor de "Requiere aprobación", atenuado como el resto de la fila (activar o desactivar la
   categoría no lo modifica).

---

### Edge Cases

- **Categorías existentes tras la migración**: todas aparecen con "No" hasta que un administrador
  active las que correspondan.
- **Consulta de aprobadores fallida o pendiente**: si no se puede saber cuántos aprobadores activos
  hay (error o respuesta aún pendiente), el formulario no muestra la advertencia, no bloquea el
  guardado y no muestra un error por ello.
- **Recuento de aprobadores**: cuenta solo usuarios activos, con el permiso de aprobar y con rol
  distinto de Lector (misma definición que HU-32); los usuarios inactivos con el permiso no cuentan.
- **Guardando**: mientras se guarda, el interruptor queda bloqueado como el resto del formulario.
- **Error al guardar**: si el guardado falla, el formulario conserva el valor del interruptor y la
  advertencia de aprobadores (si aplica); no aparece el aviso de alcance, y el error se comunica
  como el resto de errores del formulario.
- **Rol no autorizado**: si el servidor rechaza la operación con acceso denegado ("No tiene permisos
  para realizar esta acción"), se muestra ese mensaje y no se guarda nada. En la práctica, la
  pantalla de categorías ya es exclusiva del administrador.
- **Categoría inactiva**: la edición de categorías inactivas sigue las reglas actuales de HU-17; esta
  HU no las cambia.
- **Avisos devueltos por el servidor tras guardar**: la advertencia de aprobadores ya se mostró en
  el formulario antes de guardar y no se repite tras guardar. El aviso de alcance se muestra con el
  texto traducido de la interfaz, no con el texto que devuelve el servidor (que solo está en
  español).

## Requirements *(mandatory)*

### Functional Requirements

**Formulario de categoría (crear y editar)**

- **FR-001**: Los formularios de creación y edición DEBEN incluir el interruptor "Requiere
  aprobación" (Sí/No), en No por defecto en la creación y con el valor guardado en la edición. El
  campo va al final del formulario, después de "Sensibilidad por defecto" y separado de ella, y el
  interruptor muestra junto a él el texto "Sí" o "No" según su estado.
- **FR-002**: El interruptor DEBE ir acompañado del texto de ayuda "Los documentos de esta categoría
  pasarán por el flujo de aprobación."
- **FR-003**: Tras guardar con éxito una edición en la que el valor enviado del interruptor difiera
  del que tenía la categoría, el sistema DEBE mostrar, además del aviso de éxito habitual y después
  de él, un aviso emergente informativo con el texto "Este cambio solo afecta a los documentos que se
  carguen desde ahora. Los documentos existentes conservan su estado actual." El formulario NO DEBE
  mostrar este aviso antes de guardar. Si el valor no cambió, o en la creación, el aviso NO DEBE
  mostrarse.
- **FR-004**: Cuando el interruptor quede activado sin estarlo antes (en la creación, siempre que se
  active; en la edición, si el valor guardado era No) y haya menos de dos usuarios aprobadores
  activos, el formulario DEBE mostrar antes de guardar la advertencia no bloqueante "Hay menos de dos
  usuarios con permiso de aprobar. Los documentos que cargue un aprobador no podrán ser aprobados por
  él mismo." Se presenta como advertencia (no como error) bajo el interruptor.
- **FR-005**: El número de aprobadores activos DEBE obtenerse consultando los usuarios del sistema
  desde el frontend, contando los que están activos, tienen el permiso de aprobar y no son Lectores.
- **FR-006**: La advertencia de aprobadores NO DEBE impedir guardar ni añadir un paso de
  confirmación.
- **FR-007**: Al crear y al editar, el sistema DEBE enviar el valor del interruptor.
- **FR-008**: Tras guardar, la interfaz DEBE mantener los avisos de éxito actuales. Los textos de los
  avisos DEBEN salir de la propia interfaz (traducidos), no de los textos que devuelve el servidor;
  la advertencia de aprobadores NO DEBE repetirse tras guardar.

**Listado de categorías**

- **FR-009**: En la vista de tabla, el listado DEBE mostrar la columna "Requiere aprobación", entre
  "Sensibilidad por defecto" y "Documentos", con una etiqueta "Sí" (destacada) o "No" (neutra).
- **FR-010**: En la vista de tarjetas, cada categoría DEBE mostrar la etiqueta "Aprobación: Sí" o
  "Aprobación: No" junto a las de estado y sensibilidad.
- **FR-011**: En las categorías inactivas, la etiqueta de aprobación DEBE mostrarse atenuada, como el
  resto de la fila, sin perder su valor.

**Transversales**

- **FR-012**: Todos los textos nuevos DEBEN estar disponibles en español y en inglés y tratar al
  usuario de usted; las oraciones completas (avisos, ayudas) terminan en punto.
- **FR-013**: El interruptor, su texto de ayuda y los avisos DEBEN ser accesibles: el interruptor
  asociado a su etiqueta y a su ayuda, su estado (Sí/No) anunciado a las tecnologías de apoyo, y los
  avisos anunciados cuando aparecen.
- **FR-014**: Si el servidor rechaza la operación, el formulario DEBE mostrar su mensaje de error
  como el resto de errores del formulario, sin perder los valores introducidos.

### Key Entities *(include if feature involves data)*

- **Categoría**: agrupación documental. Se añade el atributo **requiere aprobación** (sí/no, "no"
  por defecto), que se conserva al activar o desactivar la categoría y solo afecta a los documentos
  que se carguen después de cambiarlo.
- **Aprobador activo**: usuario activo, con el permiso de aprobar (HU-32) y con rol distinto de
  Lector. Es un concepto derivado que el formulario usa para decidir si advierte.
- **Registro de actividad**: el cambio del atributo se registra como una edición de categoría con el
  valor anterior y el nuevo (responsabilidad del servidor).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador activa o desactiva la aprobación de una categoría existente en menos
  de 30 segundos y en un solo formulario.
- **SC-002**: En el 100 % de las ediciones guardadas que cambian el interruptor, el administrador ve
  el aviso de alcance justo después de guardar; en ninguna otra operación lo ve.
- **SC-003**: En el 100 % de las activaciones con menos de dos aprobadores activos, el administrador
  ve la advertencia antes de guardar, y en el 100 % de los casos puede guardar igualmente.
- **SC-004**: Un administrador identifica qué categorías requieren aprobación en cada página del
  listado sin abrir ningún formulario.
- **SC-005**: Todos los textos nuevos aparecen traducidos en la versión en inglés, sin textos en
  español sueltos.

## Assumptions

- **Alcance de este repositorio**: el frontend cubre los criterios 1, 3, 4 y 6 de la HU y lo que
  añade el diseño. El campo en base de datos, la migración de las 8 categorías a `false`
  (criterio 8), el rechazo con 403 a roles distintos de ADMIN (criterio 2), la conservación del
  estado de los documentos ya existentes (criterio 5) y el registro en la bitácora con
  `EDIT_CATEGORY` y `requires_approval: anterior → nuevo` (criterio 7) son responsabilidad de
  `docurural-backend` (spec `002-category-approval-config`, ya implementada).
- **Dependencia del backend**: la API de categorías expone el campo booleano `requiresApproval` en
  el listado, el detalle, la creación y la edición; en la edición es opcional (omitirlo conserva el
  valor). Las respuestas de creación y edición incluyen además `approvalScopeNotice` y
  `approverWarning`, que el frontend no usa (FR-008).
- **Recuento de aprobadores**: se obtiene del listado de usuarios existente, que ya incluye el
  estado, el rol y el permiso de aprobar (`canApprove`, HU-32) de cada usuario; no hace falta un
  endpoint nuevo. La consulta solo es necesaria cuando el administrador activa el interruptor.
- **Aviso de alcance en la creación**: no se muestra, porque una categoría nueva no tiene documentos
  existentes; el backend tampoco lo devuelve al crear.
- **Consulta por el rol EDITOR**: el backend ya permite al EDITOR consultar el listado y el detalle
  de categorías con `requiresApproval`; su uso en el formulario de carga de documentos (aviso de
  HU-33) queda fuera de alcance de esta HU.
- **Diseño**: la apariencia sigue el hand off de Claude Design (`Categories.html`, sección "HU-31"
  y artboards de HU-28B que ya incluyen el campo: listado de escritorio y móvil, crear, editar y
  crear en móvil; componentes en `sensitivity-cats.jsx`), adaptada a los componentes y tokens del
  proyecto. Se toman del diseño la ubicación del campo, el texto de ayuda, el interruptor con
  "Sí"/"No", la advertencia de aprobadores bajo el interruptor y las etiquetas del listado.
- **Desviación del diseño, aviso de alcance**: el artboard "Guardado · aviso de alcance del cambio"
  lo muestra como único toast "Cambios guardados" tras guardar. Se respeta el momento (tras guardar)
  y el tipo (informativo), pero se muestra además del aviso de éxito habitual (Clarifications); por
  eso el aviso informativo no se titula "Cambios guardados": su título concreto se fija en el plan.
- **Fuera del diseño de esta HU**: los demás cambios de los artboards de HU-28B (resumen de
  sensibilidad en la cabecera móvil, botones de las tarjetas, confirmaciones de HU-18) no forman
  parte de esta HU.
- **Filtros**: esta HU no añade un filtro por "Requiere aprobación" al listado.
