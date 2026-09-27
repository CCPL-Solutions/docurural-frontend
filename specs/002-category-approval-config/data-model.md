# Data Model: Configuración de aprobación por categoría (HU-31)

Tipos del frontend que cambian y estado del formulario. El modelo persistente
(`categories.requires_approval`) es del backend.

## Tipos (`core/models/`)

### `Category` (`category.model.ts`)

| Campo | Tipo | Cambio |
|-------|------|--------|
| `requiresApproval` | `boolean` | **Nuevo**. Siempre presente en `GET /api/categories`. |

Resto de campos sin cambios. `features/documents/dialogs/active-categories.ts` recibe el campo sin
usarlo (el aviso de la carga es de HU-33).

### Peticiones y respuestas (`category-list.model.ts`)

| Tipo | Campo | Tipo | Notas |
|------|-------|------|-------|
| `CreateCategoryRequest` | `requiresApproval` | `boolean` | Siempre se envía (R1). |
| `UpdateCategoryRequest` | `requiresApproval` | `boolean` | Siempre se envía (R1). |
| `CreateCategoryResponse` | `requiresApproval` | `boolean` | |
| `UpdateCategoryResponse` | `requiresApproval` | `boolean` | Se usa para el aviso de alcance (R4). |

`approvalScopeNotice` y `approverWarning` no se declaran (R2).

### Aprobador activo (`core/auth/permissions.ts`)

`isActiveApprover(user: User): boolean` = `status === 'ACTIVE'` y `canApprove` y
`canHoldApprovalPermission(role)`. Misma definición que el backend (`countActiveApprovers`).

## Estado del formulario (`CategoryFormDialogComponent`)

| Elemento | Tipo | Origen / regla |
|----------|------|----------------|
| `form.controls.requiresApproval` | `FormControl<boolean>` (`fb.nonNullable`) | `false` al crear; `category.requiresApproval` al editar. |
| `requiresApprovalValue` | `Signal<boolean>` | `toSignal(valueChanges)`, valor inicial del control. |
| `originalRequiresApproval` | `boolean` | `data.category?.requiresApproval ?? false`. |
| `activeApprovers` | `WritableSignal<number \| null>` | `null` hasta que responde `UsersService.list()`; sigue en `null` si falla o no se consulta. |
| `showApproverWarning` | `Signal<boolean>` | `requiresApprovalValue() && !originalRequiresApproval && activeApprovers() !== null && activeApprovers()! < 2`. |

### Transiciones

```text
ngOnInit
 ├─ edición: patchValue(requiresApproval = category.requiresApproval)
 └─ si !originalRequiresApproval → UsersService.list() → activeApprovers.set(n) | (error) nada

interruptor ON/OFF → showApproverWarning se recalcula (computed)

guardar (éxito)
 ├─ creación → toast success "Categoría creada" (sin aviso de alcance)
 └─ edición
     ├─ toast success "Categoría actualizada"
     └─ si res.requiresApproval !== originalRequiresApproval
          → toast info encolado (queue: true):
             título "Aprobación activada" | "Aprobación desactivada"
             texto  "Este cambio solo afecta a los documentos que se carguen desde ahora. …"

guardar (error) → form.enable(); el control conserva su valor; showApproverWarning intacto
```

El `Category` que devuelve el diálogo al cerrarse (`kind: 'updated'`) incluye
`requiresApproval: res.requiresApproval`.

## Listado

| Vista | Presentación | Inactiva |
|-------|--------------|----------|
| Tabla | Columna "Requiere aprobación": "Sí" (`primary`) / "No" (`neutral`) | "Sí" pasa a `neutral` |
| Tarjeta | "Aprobación: Sí" / "Aprobación: No" con icono, junto a estado y sensibilidad | Igual, atenuada |
