# Implementation Plan: Configuración de aprobación por categoría (HU-31)

**Branch**: `feature/hu-31` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-category-approval-config/spec.md`

## Summary

Añadir al frontend el indicador "Requiere aprobación" (`requiresApproval`) que el backend ya
expone en `GET/POST/PUT /api/categories`:

- **Formulario de categoría**: un interruptor Sí/No al final del formulario (en No al crear), con
  su ayuda. Si se activa y hay menos de dos aprobadores activos (recuento hecho en el cliente con
  `GET /api/users`), una advertencia no bloqueante bajo el interruptor.
- **Tras guardar una edición que cambia el valor**: el toast de éxito habitual y, detrás, un toast
  informativo con el aviso de alcance. Para que no se pisen, `NotificationService` gana una opción
  `queue` (research R5).
- **Listado**: columna "Requiere aprobación" (Sí/No) en la tabla y etiqueta "Aprobación: Sí/No" en
  las tarjetas, atenuada en las categorías inactivas.

No hay endpoints nuevos. Los textos `approvalScopeNotice` y `approverWarning` del backend no se
usan: los avisos se traducen en el cliente (research R2).

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict`, `strictTemplates`), Angular 21 standalone y
zoneless

**Primary Dependencies**: Angular Material 21 (diálogo, iconos, snackbar y, por primera vez,
`MatSlideToggle`, ya incluido en el paquete), RxJS 7.8, `@angular/localize`

**Storage**: N/A en el frontend (el campo vive en `categories.requires_approval` del backend)

**Testing**: Vitest (`@angular/build:unit-test`) y Playwright (E2E con API simulada)

**Target Platform**: navegadores modernos, de escritorio y móvil (vista en tarjetas bajo `bp.md`)

**Project Type**: aplicación web (SPA) que consume la API REST de `docurural-backend`

**Performance Goals**: sin requisitos nuevos; una consulta extra de usuarios (sin paginar, decenas
de registros) al abrir el formulario, y solo si la activación es posible

**Constraints**: constitución v1.0.0 (tokens de diseño, i18n `es-CO`/`en`, OnPush, sin librerías
nuevas); contrato del backend en `feature/hu-31` (commit `768b5bb`)

**Scale/Scope**: la feature `categories` (formulario y listado), un componente nuevo, dos modelos de
`core/models/`, una función de `core/auth/permissions.ts`, una opción de `NotificationService`,
unos 12 textos nuevos y sus specs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cómo se cumple | Estado |
|-------|----------------|--------|
| ARQ-01/06 | Solo cambian modelos existentes de `core/models/`; el HTTP sigue en `CategoriesService` y `UsersService`, sin URLs nuevas | ✅ |
| ARQ-02/05 | Todo el código de UI queda en `features/categories/`; `UsersService` se consume desde `@core`, no desde `features/users` | ✅ |
| CMP-01…12 | Componente nuevo `app-category-approval-badge`: OnPush, `input()`, plantilla inline ≤ 40 líneas, `@if` | ✅ |
| EST-01/02/05 | Recuento: servicio → `subscribe` → `signal.set` con `takeUntilDestroyed`; la advertencia es un `computed()` | ✅ |
| API-01/02 | El error de la consulta de usuarios se ignora sin leer su cuerpo; 401 intacto en el interceptor | ✅ |
| API-07 | `Create/UpdateCategoryRequest` tipados con `requiresApproval` | ✅ |
| API-08 | Los dos toasts pasan por `NotificationService` (opción `queue`, sin mecanismo paralelo) | ✅ |
| RUT-02 | `isActiveApprover(user)` en `core/auth/permissions.ts`; ninguna comparación de rol fuera | ✅ |
| FRM-01/05 | Control `requiresApproval` en `fb.nonNullable`, enlazado con `formControlName` | ✅ |
| UI-01/02/09 | Colores del interruptor, badge y advertencia con tokens `--color-*` existentes; overrides de Material en `_material-overrides.scss` con variables CSS apuntando a tokens | ✅ |
| UI-05/10 | Interruptor con `role="switch"` (Material), asociado a su etiqueta y ayuda con `aria-labelledby`/`aria-describedby`; advertencia con `<app-alert>` | ✅ |
| UI-08 | Etiqueta, ayuda y advertencia con `--text-base` (16 px); no se reutilizan `field__hint` ni `level-banner__text` (14 px, deuda) | ✅ |
| CAL-01/02 | Textos en usted, `i18n`/`$localize` con IDs `@@categories.*`; `messages.en.xlf` actualizado | ✅ |
| CAL-07/08 | Spec nueva del formulario (hoy no existe) y del badge; specs ampliadas de permisos, notificaciones y listado; fixture E2E y capturas `categories` | ✅ |
| Restricciones | `MatSlideToggle` es de Angular Material, ya dependencia: no es una librería nueva | ✅ |

**Resultado**: pasa sin excepciones. **Re-check tras la fase 1**: el diseño (data-model,
contracts) no añade estado global, rutas ni dependencias; el cambio en `NotificationService` es
aditivo (opción opcional) y conserva el comportamiento actual por defecto. Sigue pasando.

## Project Structure

### Documentation (this feature)

```text
specs/002-category-approval-config/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R11
├── data-model.md        # Fase 1: tipos y estado del formulario
├── quickstart.md        # Fase 1: guía de validación
├── contracts/
│   └── categories-api.md  # Fase 1: contrato consumido del backend
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/app/
├── core/
│   ├── auth/
│   │   ├── permissions.ts                 # + isActiveApprover(user)
│   │   └── permissions.spec.ts            # + casos de isActiveApprover
│   ├── models/
│   │   ├── category.model.ts              # Category + requiresApproval
│   │   └── category-list.model.ts         # Create/Update request y response + requiresApproval
│   └── services/
│       ├── notification.service.ts        # + opción { queue } (R5)
│       └── notification.service.spec.ts   # + casos de queue
├── features/categories/category-list/
│   ├── category-list.component.html       # columna y etiqueta en tarjetas
│   ├── category-list.component.scss       # .col-approval y reparto de anchos
│   ├── category-list.component.spec.ts    # + columna y tarjeta
│   └── components/
│       ├── category-approval-badge.component.ts       # NUEVO
│       ├── category-approval-badge.component.spec.ts  # NUEVO
│       └── category-form-dialog/
│           ├── category-form-dialog.component.ts      # control, recuento, advertencia, toasts
│           ├── category-form-dialog.component.html    # campo "Requiere aprobación"
│           ├── category-form-dialog.component.scss    # bloque del interruptor (tokens)
│           └── category-form-dialog.component.spec.ts # NUEVO
src/styles/_material-overrides.scss        # .app-switch (variables del slide toggle → tokens)
src/locale/messages.xlf, messages.en.xlf   # textos nuevos
e2e/support/fixtures.ts                    # requiresApproval en /categories
e2e/visual.spec.ts-snapshots/              # capturas "categories" regeneradas (Windows)
CHANGELOG.md                               # entrada de la HU-31
```

**Structure Decision**: proyecto Angular único con la estructura por capas de la constitución. El
cambio se limita a la feature `categories`, más dos modelos de `core/models/`, una función de
`core/auth/permissions.ts`, una opción aditiva de `NotificationService` y un override global de
Material.

## Dependencias y riesgos

| Tipo | Detalle | Mitigación |
|------|---------|------------|
| Dependencia | Backend `feature/hu-31` (campo `requiresApproval`, migración) desplegado para probar contra la API real | Tests unitarios y E2E con API simulada no dependen de él |
| UX | Con la respuesta B, el aviso de alcance aparece unos 5 s después de guardar (cuando se cierra el toast de éxito) | Queda documentado (R5); si resulta lento, se puede acortar la duración del toast de éxito en ese caso sin cambiar el diseño |
| Maquetación | Una columna fija más en la tabla puede desbordarla a 1280 px con el menú lateral | Rebajar porcentajes de las columnas flexibles y validar con la captura `categories-desktop` |
| Material | El tamaño del slide toggle de Material (M3) es mayor que el del diseño (40 × 22) | Ajustarlo con sus variables `--mat-slide-toggle-*`; si no alcanza, se acepta el tamaño de Material con los colores del sistema (R7) |
| Visual | Las capturas E2E `categories` cambian | Regenerar en Windows con `--update-snapshots` |

## Complexity Tracking

No hay violaciones de la constitución que justificar.
