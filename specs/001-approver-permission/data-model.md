# Data Model: Permiso para aprobar documentos (HU-32)

Modelos del frontend (`src/app/core/models/`) que cambian. La persistencia y las reglas de negocio
son del backend (ver [contracts/users-api.md](./contracts/users-api.md)).

## Tipos

### `User` (`user.model.ts`)

| Campo | Tipo | Cambio | Notas |
|-------|------|--------|-------|
| `canApprove` | `boolean` | Nuevo | Siempre presente en las respuestas. `false` en usuarios anteriores a la HU. |

`AuthenticatedUser` (la sesión) **no** cambia: el permiso no viaja en el JWT ni se guarda en la
sesión (FR-017).

### `CreateUserRequest` (`user-form.model.ts`)

| Campo | Tipo | Cambio | Notas |
|-------|------|--------|-------|
| `canApprove` | `boolean` | Nuevo, obligatorio en el tipo | El formulario siempre lo envía; `false` si el rol es READER. |

### `UpdateUserRequest` (`user-form.model.ts`)

| Campo | Tipo | Cambio | Notas |
|-------|------|--------|-------|
| `canApprove` | `boolean` (opcional) | Nuevo | Se omite en la autoedición (el servidor conserva el valor). `false` si el rol es READER. |

### `UpdateUserResponse` (`user-form.model.ts`)

| Campo | Tipo | Cambio | Notas |
|-------|------|--------|-------|
| `canApprove` | `boolean` | Nuevo | Valor efectivo tras el retiro automático; decide el toast de retirada. |

`CreateUserResponse` lo hereda de `User`. `UserFormDialogResult` (`kind: 'updated'`) pasa a usar
`Omit<UpdateUserResponse, 'message'>`, que incluye `canApprove`.

## Estado del formulario (`UserFormDialogComponent`)

| Elemento | Tipo | Origen | Regla |
|----------|------|--------|-------|
| `form.controls.canApprove` | `FormControl<boolean>` | `fb.nonNullable`, `false` | En edición se rellena con `user.canApprove`. |
| `selectedRole` (signal) | `Role \| ''` | `toSignal(role.valueChanges)` | Deriva ayuda, aviso y habilitación. |
| `rememberedCanApprove` | `boolean` (campo privado) | Valor al entrar en READER | Se restaura al salir de READER (FR-006). |
| `approvalHint` | `computed` | rol + autoedición | Texto por rol (FR-003) o de autoedición (FR-008). |
| `showRevokeWarning` | `computed` | edición, no autoedición, `user.canApprove`, rol READER | FR-005. |

### Habilitación de la casilla

| Condición | Casilla | Valor enviado |
|-----------|---------|---------------|
| Rol ADMIN o EDITOR, no autoedición | Habilitada | El de la casilla |
| Rol READER | Deshabilitada, desmarcada | `false` |
| Autoedición (siempre ADMIN) | Deshabilitada, valor actual | Omitido |
| Guardando | Deshabilitada | — |
| Sin rol elegido (creación) | Habilitada, desmarcada | El de la casilla (el rol es obligatorio) |

### Transiciones del valor en pantalla

| Desde | Evento | Hasta |
|-------|--------|-------|
| ADMIN/EDITOR, casilla = X | Elegir READER | READER, casilla `false` deshabilitada, recuerda X |
| READER (recordado X) | Elegir ADMIN/EDITOR | casilla = X habilitada |
| READER de origen (X = `false`) | Elegir EDITOR | casilla `false` habilitada, sin aviso |
| Cualquiera | Error al guardar | Se desbloquea y reaplica la tabla de habilitación |

## Derivados en el listado

| Concepto | Regla |
|----------|-------|
| Etiqueta "Aprobador" | `user.canApprove === true` |
| Etiqueta atenuada | `user.canApprove && user.status === 'INACTIVE'` |
| Nota en activar/desactivar | `user.canApprove === true` |
