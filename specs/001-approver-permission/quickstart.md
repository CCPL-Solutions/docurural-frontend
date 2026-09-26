# Quickstart: validar la HU-32 (permiso para aprobar documentos)

## Requisitos

- Backend con la HU-32 (`docurural-backend`, rama `feature/hu-32` o posterior) en
  `localhost:8080`, con la migración `V3__add_can_approve_to_users.sql` aplicada. Alternativa:
  `npm run start:develop` si Desarrollo ya tiene la HU-32 desplegada.
- Sesión como ADMIN y, al menos, otro ADMIN, un EDITOR y un READER de prueba.

```bash
npm ci
npm start          # http://localhost:4200
```

## Escenarios manuales (Usuarios → listado)

| # | Pasos | Resultado esperado | Spec |
|---|-------|--------------------|------|
| 1 | "Nuevo usuario" | Bloque "Aprobación de documentos", casilla desmarcada | US2-1, FR-001 |
| 2 | Crear EDITOR con la casilla marcada | Toast de creación; la fila muestra "Aprobador" | US2-2, FR-010 |
| 3 | En creación, elegir Administrador | Texto "El rol Administrador no incluye este permiso…" | US1-3, FR-003 |
| 4 | En creación, elegir Lector | Casilla desmarcada y deshabilitada, "Los lectores no pueden aprobar documentos." | US3-1, FR-004 |
| 5 | Editar el EDITOR aprobador → rol Lector | Casilla desmarcada y bloqueada, aviso de retirada con su nombre | US3-2, FR-005 |
| 6 | En el mismo formulario → rol Editor | Casilla marcada de nuevo, sin aviso | US3-3, FR-006 |
| 7 | Repetir 5 y guardar | Toast "Se retiró el permiso para aprobar documentos."; sin etiqueta | US3-4, FR-007 |
| 8 | Editar su propia cuenta | Casilla deshabilitada con su valor y la explicación de autoedición | US1-5, FR-008 |
| 9 | Desactivar un aprobador | La confirmación dice que dejará de contar como aprobador activo | US5-1, FR-013 |
| 10 | Tras 9, ver el listado | Etiqueta "Aprobador" atenuada; con lector de pantalla se oye la explicación | US4-3, FR-011, FR-016 |
| 11 | Reactivarlo | La confirmación dice que conserva el permiso; etiqueta sin atenuar | US5-2, US5-4 |
| 12 | Desactivar un usuario sin permiso | Ningún texto sobre aprobación | US5-3 |
| 13 | Vista estrecha (< `bp.md`) | La etiqueta aparece junto a rol y estado en la tarjeta | US4-4 |
| 14 | `npm run start:en` y repetir 1, 4, 5, 9 | Todos los textos nuevos en inglés | FR-015, SC-005 |

Comprobación de red (DevTools): en 8, el `PUT` no incluye `canApprove`; en 7, envía
`"canApprove": false`; en 4 (al crear), envía `"canApprove": false`.

## Comprobaciones automáticas

```bash
npm run lint
npm run check:styles
npm run test:ci
npm run extract-i18n    # y actualizar src/locale/messages.en.xlf
npm run build
npm run format:check
npm run e2e:ci
npm run e2e -- --update-snapshots   # solo en Windows: la captura "users" cambia a propósito
```

Todo en verde es la definición de terminado de la constitución.
