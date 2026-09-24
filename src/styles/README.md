# Sistema de estilos · DocuRural

Esta carpeta contiene los **tokens de diseño** y los **partials globales**
que usan los componentes del proyecto. `src/styles.scss` los carga todos.

> Regla de oro: **no usar literales** (`#fff`, `12px`, `8px`, etc.) en los SCSS
> de componente. Si un valor no encaja con ningún token, se ajusta al token más
> cercano (en empate, al mayor, para no reducir áreas táctiles); si no es
> posible, se añade un token nuevo.
>
> `npm run check:styles` lo verifica y **hace fallar la CI** (regla UI-01, UI-03,
> UI-05 y UI-09 de la constitución). Excepciones: `0`, `1px` en
> `padding`/`margin`/`gap` (líneas finas) y los tamaños de icono, que se escriben
> con el mixin `icon.size(Npx)`.

---

## Partials globales

Cada partial es CSS puro (sin mixin) cargado globalmente desde `styles.scss`.
Los componentes no necesitan `@use` ni `@include` para usarlos.

| Archivo                     | Contenido                                                                         |
| --------------------------- | --------------------------------------------------------------------------------- |
| `_tokens.scss`              | CSS custom properties: color, tipografía, espaciado, radius, sombras              |
| `_material-overrides.scss`  | `.mat-select-field`, `.dialog-flush`, toast panel, sort-menu overlay              |
| `_form-field.scss`          | `.field`, `.field__*` BEM — inputs, selects, textareas, labels                    |
| `_dialog-shell.scss`        | `.dialog-container/header/title/close/alert/form/fields/footer`                   |
| `_dropzone.scss`            | `.dropzone` + modificadores `--dragover/filled/error` + subclases                 |
| `_confirmation-dialog.scss` | `.dialog` shell para dialogs de confirmación con div personalizado                |
| `_list-view.scss`           | `.action-bar`, `.sort-trigger`, `.counter`, `.desktop/mobile-only`, `.title-link` |

### Mixins por archivo (requieren `@use`)

| Archivo             | Mixin            | Uso                                                                                                      |
| ------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `_breakpoints.scss` | `lg`, `md`, `sm` | `@media (max-width: 1024px / 768px / 600px)`. En TS, `shared/ui/breakpoints.ts` con `BreakpointObserver` |
| `_icons.scss`       | `size($size)`    | Tamaño de icono (`font-size`, `width` y `height` iguales)                                                |
| `_data-table.scss`  | `styles`         | Shell de tabla (thead, tbody, td)                                                                        |
| `_entity-card.scss` | `base`           | Card base para listas móviles                                                                            |

### Componente Angular compartido

| Selector             | Ruta                              | Propósito                    |
| -------------------- | --------------------------------- | ---------------------------- |
| `<app-sort-trigger>` | `shared/components/sort-trigger/` | Botón de ordenamiento + menú |

---

---

## Color

### Marca

| Token                    | Valor     | Uso típico                             |
| ------------------------ | --------- | -------------------------------------- |
| `--color-primary`        | `#2E6DA4` | Botones primarios, foco, links activos |
| `--color-primary-dark`   | `#1E4F7A` | Hover de botón primario, badges admin  |
| `--color-primary-light`  | `#EBF3FB` | Fondo de banner info, badges admin     |
| `--color-primary-border` | `#C8DDF1` | Borde de toast/banner info             |

### Semánticos

Cada familia (`success`, `error`, `warning`) tiene **4 tokens**: color base,
fondo claro, borde y texto sobre fondo claro.

| Familia   | Base              | Light                   | Border                   | Text                   |
| --------- | ----------------- | ----------------------- | ------------------------ | ---------------------- |
| `success` | `--color-success` | `--color-success-light` | `--color-success-border` | `--color-success-text` |
| `error`   | `--color-error`   | `--color-error-light`   | `--color-error-border`   | `--color-error-text`   |
| `warning` | `--color-warning` | `--color-warning-light` | `--color-warning-border` | `--color-warning-text` |

El selector de sensibilidad usa además `--color-warning-selected` y
`--color-error-selected` como fondo de la tarjeta seleccionada.

### Acentos

Familias sin significado semántico para las paletas por nombre (categorías,
avatares), los formatos de archivo y el gráfico. Base, fondo claro y texto:

| Familia  | Base             | Light                  | Text                  |
| -------- | ---------------- | ---------------------- | --------------------- |
| `purple` | `--color-purple` | `--color-purple-light` | `--color-purple-text` |
| `teal`   | `--color-teal`   | `--color-teal-light`   | `--color-teal-text`   |

Las paletas de TypeScript (`shared/utils/name-color.ts`, `document-format.ts`)
usan `var(--color-*)`. chart.js dibuja en canvas y no resuelve `var()`:
`category-chart` lee los tokens ya resueltos con `getComputedStyle`.

### Sidebar (superficie oscura)

Usar **siempre** los overlays / fg semánticos en lugar de `rgba(255,255,255,X)`:

| Token                 | Uso                                        |
| --------------------- | ------------------------------------------ |
| `--sidebar-overlay-1` | Hover sutil de items                       |
| `--sidebar-overlay-2` | Bordes / divisores dentro del sidebar      |
| `--sidebar-overlay-3` | Estado activo, badges                      |
| `--sidebar-fg-muted`  | Texto deshabilitado / etiquetas de sección |
| `--sidebar-fg-soft`   | Texto secundario                           |
| `--sidebar-fg-strong` | Texto primario sobre badges                |

### Superficies, bordes, texto

- `--color-bg-app`, `--color-bg-card`, `--color-bg-hover`, `--color-bg-subtle`,
  `--color-bg-media` (visor a pantalla completa)
- `--color-border`, `--color-border-strong`, `--color-divider`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`,
  `--color-text-inverse`

---

## Tipografía

`--font-sans` → Inter con stack de fallback. Es la única familia.

### Escala

| Token          | Valor | Uso típico                                          |
| -------------- | ----- | --------------------------------------------------- |
| `--text-4xs`   | 8px   | Etiqueta del formato dentro del icono de archivo    |
| `--text-3xs`   | 10px  | Badges compactos (ADMIN)                            |
| `--text-2xs`   | 11px  | Labels en MAYÚSCULAS (sidebar section, table thead) |
| `--text-xs`    | 12px  | Captions, badges, meta                              |
| `--text-sm`    | 13px  | Texto pequeño, kickers, footers                     |
| `--text-md`    | 14px  | Cuerpo denso (tablas, navegación)                   |
| `--text-md-15` | 15px  | Subtítulos de página, navegación secundaria         |
| `--text-base`  | 16px  | ⭐ Cuerpo por defecto, inputs, botones              |
| `--text-lg`    | 18px  | h3, título de diálogo                               |
| `--text-xl`    | 20px  | h2, título de diálogo grande                        |
| `--text-2xl`   | 24px  | h1 móvil                                            |
| `--text-3xl`   | 28px  | h1 desktop (page hero)                              |
| `--text-4xl`   | 32px  | Cifras destacadas (tarjetas KPI)                    |

> **No reducir el cuerpo por debajo de `--text-base` (16 px)** — es un
> requerimiento de a11y declarado en `CLAUDE.md §UI`.

---

## Espaciado

Escala basada en múltiplos de 4 px, con medios pasos hasta 14 px para
paddings de badges y controles compactos. Usar para `padding`, `margin`, `gap`.
Para un valor negativo: `calc(var(--space-2) * -1)`.

| Token         | Valor |
| ------------- | ----- |
| `--space-0-5` | 2px   |
| `--space-1`   | 4px   |
| `--space-1-5` | 6px   |
| `--space-2`   | 8px   |
| `--space-2-5` | 10px  |
| `--space-3`   | 12px  |
| `--space-3-5` | 14px  |
| `--space-4`   | 16px  |
| `--space-5`   | 20px  |
| `--space-6`   | 24px  |
| `--space-7`   | 32px  |
| `--space-8`   | 40px  |
| `--space-9`   | 48px  |

---

## Border radius

| Token             | Valor  | Uso típico                               |
| ----------------- | ------ | ---------------------------------------- |
| `--radius-xs`     | 4px    | Etiquetas diminutas, barras, indicadores |
| `--radius-sm`     | 6px    | Toggles, icon buttons, badges pequeños   |
| `--radius-md`     | 8px    | Botones, inputs, banners                 |
| `--radius-lg`     | 12px   | Cards, dialogs, contenedores             |
| `--radius-pill`   | 9999px | Badges con dot, chips redondeados        |
| `--radius-circle` | 50%    | Avatares, puntos, indicadores redondos   |

---

## Sombras

| Token           | Uso                                       |
| --------------- | ----------------------------------------- |
| `--shadow-card` | Card flotante (login, toast, dialog body) |

---

## Focus rings

| Token                  | Uso                                       |
| ---------------------- | ----------------------------------------- |
| `--focus-ring`         | Foco por defecto (sobre superficie clara) |
| `--focus-ring-error`   | Foco sobre campo en estado de error       |
| `--focus-ring-on-dark` | Foco sobre el sidebar / superficie oscura |

---

## Movimiento

| Token               | Valor                          | Uso                                   |
| ------------------- | ------------------------------ | ------------------------------------- |
| `--duration-fast`   | 150ms                          | Hover, focus, micro-interacciones     |
| `--duration-medium` | 200ms                          | Transiciones de panel (sidebar slide) |
| `--easing-standard` | `cubic-bezier(0.2, 0, 0.2, 1)` | Curva por defecto                     |

---

## Material y tokens de marca

`mat.theme()` se incluye en `styles.scss` con familia tipográfica `Inter` y
paleta `azure`. Como la paleta predeterminada **no coincide** exactamente con
el azul institucional, tras el include se sobrescriben los tokens
`--mat-sys-primary*` para apuntar a los tokens del brand:

```scss
--mat-sys-primary: var(--color-primary);
--mat-sys-on-primary: var(--color-text-inverse);
--mat-sys-primary-container: var(--color-primary-light);
--mat-sys-on-primary-container: var(--color-primary-dark);
```

Resultado: cualquier widget de Material que use `color="primary"` aparece con
el azul institucional sin necesidad de overrides puntuales.

---

## ¿Cómo añadir un token nuevo?

1. Verifica que **no existe** un token equivalente.
2. Añádelo en `_tokens.scss` dentro del bloque temático correspondiente.
3. Documéntalo en este README en la tabla pertinente.
