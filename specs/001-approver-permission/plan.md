# Implementation Plan: Permiso para aprobar documentos (HU-32)

**Branch**: `feature/hu-32` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-approver-permission/spec.md`

## Summary

Añadir al frontend el permiso "Puede aprobar documentos" (`canApprove`) que el backend ya expone
en `GET/POST/PUT /api/users`:

- **Formulario de usuario**: un control `canApprove` y un bloque "Aprobación de documentos" con la
  casilla y un texto de ayuda según el rol. La casilla se bloquea para los lectores y en la
  autoedición. Al pasar a Lector recuerda su valor, avisa antes de guardar y, si se guarda, muestra
  un toast específico.
- **Listado**: la etiqueta "Aprobador", atenuada si el usuario está inactivo.
- **Diálogo de activar/desactivar**: una nota sobre la aprobación, solo para aprobadores.

No hay endpoints nuevos. En la autoedición el frontend omite `canApprove`, porque el backend no
bloquea el cambio del propio permiso (research R3).

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict`, `strictTemplates`), Angular 21 standalone y
zoneless

**Primary Dependencies**: Angular Material 21 (diálogos, iconos, tooltip), RxJS 7.8,
`@angular/localize`

**Storage**: N/A en el frontend (el campo vive en `users.can_approve` del backend)

**Testing**: Vitest (`@angular/build:unit-test`) y Playwright (E2E con API simulada)

**Target Platform**: navegadores modernos, de escritorio y móvil (vista en tarjetas bajo `bp.md`)

**Project Type**: aplicación web (SPA) que consume la API REST de `docurural-backend`

**Performance Goals**: sin requisitos nuevos; un campo booleano más por usuario

**Constraints**: constitución v1.0.0 (tokens de diseño, i18n `es-CO`/`en`, OnPush, sin librerías
nuevas); contrato del backend en `feature/hu-32`

**Scale/Scope**: una feature (`users`), unos 10 archivos de código, 13 textos nuevos y sus specs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cómo se cumple | Estado |
|-------|----------------|--------|
| ARQ-01/06 | Solo cambian modelos existentes de `core/models/`; el HTTP sigue en `UsersService`, sin cambios de URL | ✅ |
| ARQ-02/05 | Todo queda dentro de `features/users/`; imports con alias | ✅ |
| CMP-01…12 | Componente nuevo `app-approver-badge`: OnPush, `input()`, plantilla inline ≤ 40 líneas, `@if` | ✅ |
| EST-02/05 | `role.valueChanges` → `takeUntilDestroyed`; la suscripción solo toca el `FormControl` (puente imperativo); lo derivado con `computed()` | ✅ |
| API-01/02 | Mensaje del 400 con `toApiError()`; 401 intacto en el interceptor | ✅ |
| API-07 | `CreateUserRequest`/`UpdateUserRequest` tipados con `canApprove` | ✅ |
| RUT-02 | `canHoldApprovalPermission(role)` en `core/auth/permissions.ts`; ninguna comparación de rol fuera | ✅ |
| FRM-01/05 | Control en `fb.nonNullable`; casilla con `formControlName` (sin `ngModel`) | ✅ |
| UI-01/02/09 | Colores `--color-purple-*` y `--color-warning-*` ya existentes; espaciado con tokens | ✅ |
| UI-05/10 | Casilla envuelta en `<label>`; ayuda con `aria-describedby`; aviso con `<app-alert>` (`role="alert"`) | ✅ |
| UI-08 | Textos de ayuda y aviso ≥ `--text-base` salvo la etiqueta (badge, permitido) | ✅ (revisar en la implementación) |
| CAL-01/02 | Textos en usted, `i18n`/`$localize` con IDs `@@users.*`; `messages.en.xlf` actualizado | ✅ |
| CAL-07/08 | Specs nuevas y ampliadas; fixture E2E y captura `users` actualizados | ✅ |
| FR-017 | `AuthenticatedUser` no cambia; nada lee el permiso de la sesión | ✅ |

**Resultado**: pasa sin excepciones. **Re-check tras la fase 1**: el diseño (data-model,
contracts) no introduce nuevas dependencias, estados globales ni rutas; sigue pasando.

## Project Structure

### Documentation (this feature)

```text
specs/001-approver-permission/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R12
├── data-model.md        # Fase 1: tipos y estado del formulario
├── quickstart.md        # Fase 1: guía de validación
├── contracts/
│   └── users-api.md     # Fase 1: contrato consumido del backend
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/app/
├── core/
│   ├── auth/
│   │   ├── permissions.ts                 # + canHoldApprovalPermission(role)
│   │   └── permissions.spec.ts            # + casos ADMIN/EDITOR/READER
│   └── models/
│       ├── user.model.ts                  # User + canApprove
│       └── user-form.model.ts             # Create/Update request y UpdateUserResponse + canApprove
├── features/users/
│   ├── user-form-dialog/
│   │   ├── user-form-dialog.component.ts   # control, rol como signal, sync, aviso, toast, 400
│   │   ├── user-form-dialog.component.html # bloque "Aprobación de documentos"
│   │   ├── user-form-dialog.component.scss # tarjeta de la casilla (tokens)
│   │   └── user-form-dialog.component.spec.ts  # NUEVO
│   ├── user-list/
│   │   ├── user-list.component.html        # etiqueta en tabla y tarjetas
│   │   ├── user-list.component.spec.ts     # + etiqueta activa / atenuada / ausente
│   │   └── components/
│   │       ├── approver-badge.component.ts       # NUEVO
│   │       ├── approver-badge.component.spec.ts  # NUEVO
│   │       └── user-identity.component.ts        # + <ng-content> junto al nombre (y su scss)
│   └── toggle-status-dialog/
│       ├── toggle-status-dialog.component.ts|html  # nota para aprobadores
│       └── toggle-status-dialog.component.spec.ts  # + casos con y sin permiso
├── shared/components/badge/
│   ├── badge.component.ts                 # + variante 'accent'
│   └── badge.component.scss               # estilos de 'accent' con --color-purple-*
src/locale/messages.xlf, messages.en.xlf   # textos nuevos
e2e/support/fixtures.ts                    # canApprove en /users
e2e/visual.spec.ts-snapshots/              # captura "users" regenerada (Windows)
CHANGELOG.md                               # entrada de la HU-32 en 1.1.0
```

**Structure Decision**: proyecto Angular único con la estructura por capas de la constitución. El
cambio se limita a la feature `users`, más dos modelos de `core/models/`, una función de
`core/auth/permissions.ts` y una variante del badge de `shared/`.

## Dependencias y riesgos

| Tipo | Detalle | Mitigación |
|------|---------|------------|
| Dependencia | Backend `feature/hu-32` (campo `canApprove`, migración V3) desplegado para probar contra API real | Tests unitarios y E2E con API simulada no dependen de él |
| Brecha backend | No bloquea el cambio del propio `canApprove` | Frontend omite el campo en la autoedición; seguimiento en `docurural-backend` |
| Visual | La captura E2E `users` cambia | Regenerar en Windows con `--update-snapshots` |
| a11y | Disponibilidad de `cdk-visually-hidden` | Verificar; si falta, utilidad propia en `src/styles/` |

## Complexity Tracking

No hay violaciones de la constitución que justificar.
