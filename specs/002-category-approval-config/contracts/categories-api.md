# Contrato consumido: API de categorías y usuarios (HU-31)

Fuente: `docurural-backend`, rama `feature/hu-31` (commit `768b5bb`),
`specs/002-category-approval-config/contracts/categories-api.md`. No hay endpoints nuevos. Aquí
solo se recoge lo que el frontend usa.

## `GET /api/categories` (ADMIN, EDITOR)

Cada elemento de `categories` añade:

```json
{ "requiresApproval": false }
```

## `POST /api/categories` (ADMIN)

Request (el frontend lo envía siempre):

```json
{ "name": "…", "description": null, "defaultSensitivityLevel": "INTERNAL", "requiresApproval": true }
```

Response `201`: añade `requiresApproval` (y `approverWarning`, que el frontend ignora).

## `PUT /api/categories/{id}` (ADMIN)

Request: añade `"requiresApproval": true | false` (siempre).

Response `200`: añade `requiresApproval` (y `approvalScopeNotice` / `approverWarning`, que el
frontend ignora; research R2).

| Situación | Lo que hace el frontend |
|-----------|-------------------------|
| `res.requiresApproval` igual al valor previo | Solo el toast de éxito. |
| `res.requiresApproval` distinto del valor previo | Toast de éxito y, detrás, toast informativo de alcance. |
| 403 (rol o categoría inactiva) | `<app-alert>` con el texto actual del formulario (R10). |

## `GET /api/users` (ADMIN), sin cambios

Se usa solo para contar aprobadores activos: `users[].status`, `users[].role` y
`users[].canApprove` (HU-32). Un error de esta consulta no se comunica al usuario (research R3).

## Textos del backend que el frontend replica con `$localize`

| Backend (clave) | Frontend |
|-----------------|----------|
| `category.requires-approval.scope-notice` | Descripción del toast de alcance (con punto final). |
| `category.requires-approval.few-approvers` | Advertencia del formulario (con punto final). |
