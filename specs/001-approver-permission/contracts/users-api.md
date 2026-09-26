# Contrato consumido: API de usuarios — `canApprove` (HU-32)

Fuente de verdad: `docurural-backend/specs/001-user-approval-permission/contracts/users-api.md`
(implementado en la rama `feature/hu-32` del backend). Este documento resume solo lo que el
frontend consume y cómo lo usa. No hay endpoints nuevos; todos exigen rol ADMIN.

## `GET /api/users`

Cada elemento de `users[]` añade `"canApprove": boolean`.

Uso: etiqueta "Aprobador" (atenuada si `status = INACTIVE`) y nota en el diálogo de
activar/desactivar.

## `POST /api/users`

```json
{
  "fullName": "Ana Gómez Torres",
  "email": "coordinadora@minayticha.edu.co",
  "password": "…",
  "confirmPassword": "…",
  "role": "EDITOR",
  "canApprove": true
}
```

| Caso | Respuesta | Frontend |
|------|-----------|----------|
| ADMIN/EDITOR con `true`/`false` | 201, `canApprove` guardado | Toast "Usuario creado" actual |
| READER con `true` | 400 `INVALID_ARGUMENT`, "Los lectores no pueden aprobar documentos" | No debería ocurrir (casilla bloqueada); si ocurre, se muestra el mensaje en `<app-alert>` |

## `PUT /api/users/{id}`

```json
{ "fullName": "…", "email": "…", "role": "READER", "canApprove": false }
```

| Caso | Respuesta | Frontend |
|------|-----------|----------|
| `canApprove` omitido | 200, conserva el valor | Se usa en la autoedición |
| ADMIN/EDITOR con `true`/`false` | 200, aplicado | Toast "Usuario actualizado" actual |
| Cambio a READER (desde ADMIN/EDITOR) | 200, `canApprove: false` forzado | Si antes era `true`: toast "Se retiró el permiso para aprobar documentos." |
| Ya READER con `true` | 400 `INVALID_ARGUMENT` | No debería ocurrir; mensaje del servidor en `<app-alert>` |

## `PATCH /api/users/{id}/status`

Sin cambios. Conserva `canApprove`; el listado se recarga tras la acción.

## Lo que el frontend NO hace

- No lee `canApprove` de la sesión ni del JWT (FR-017).
- No calcula recuentos de aprobadores (Clarifications: el contador queda para otra HU).

## Brecha conocida del backend

El backend no rechaza que un ADMIN cambie su **propio** `canApprove`. El frontend lo evita omitiendo
el campo en la autoedición (ver [research.md](../research.md), R3). Seguimiento pendiente en
`docurural-backend`.
