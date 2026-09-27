# Quickstart: validar la HU-31

## Requisitos

- Dependencias instaladas (`npm ci`).
- Para probar contra la API real: backend en la rama `feature/hu-31` (migración de
  `requires_approval`) y `npm start` (o `npm run start:develop`), con sesión de ADMIN.

## Comprobaciones automáticas

```bash
npm run lint
npm run check:styles
npm run test:ci          # incluye category-form-dialog, category-approval-badge, permissions y notification
npm run extract-i18n     # sin avisos; messages.en.xlf actualizado
npm run build            # es y en, con i18nMissingTranslation: error
npm run format:check
npm run e2e:ci           # flujos (fixture de /categories con requiresApproval)
npm run e2e              # capturas (Windows): categories-desktop / categories-mobile-600 regeneradas
```

## Validación manual (ADMIN)

| # | Pasos | Resultado esperado | Spec |
|---|-------|--------------------|------|
| 1 | Categorías → listado | Columna "Requiere aprobación" entre sensibilidad y documentos; tras la migración, todas en "No" | FR-009, US4 |
| 2 | Ventana estrecha (< 768 px) | Tarjetas con "Aprobación: No" junto a estado y sensibilidad | FR-010 |
| 3 | Nueva categoría | Interruptor al final, en "No", con la ayuda "Los documentos de esta categoría pasarán por el flujo de aprobación." | FR-001/002 |
| 4 | Con < 2 aprobadores activos (ver Usuarios), activar el interruptor | Advertencia ámbar bajo el interruptor; se puede crear igualmente; solo aparece "Categoría creada" | FR-004/006, US2-4 |
| 5 | Con ≥ 2 aprobadores activos, repetir 4 | Sin advertencia | US3-3 |
| 6 | Editar una categoría en "No", activar y guardar | Toast "Categoría actualizada" y, al cerrarse, toast informativo "Aprobación activada" con el texto de alcance; el listado muestra "Sí" | FR-003, US1-3 |
| 7 | Editar esa categoría, desactivar y guardar | Toast de éxito y después "Aprobación desactivada"; sin advertencia de aprobadores | FR-003 |
| 8 | Editar solo el nombre | Solo el toast de éxito | US1-5 |
| 9 | Cambiar el interruptor y volverlo a su valor, guardar | Solo el toast de éxito | US1-4 |
| 10 | Editar una categoría en "Sí" | Sin advertencia al abrir, aunque haya < 2 aprobadores | US3-5 |
| 11 | Desactivar una categoría con "Sí" | Su etiqueta sigue en "Sí", atenuada | FR-011 |
| 12 | Teclado y lector de pantalla | El interruptor se alterna con Espacio, anuncia "Requiere aprobación", su estado y la ayuda; la advertencia se anuncia al aparecer | FR-013 |
| 13 | Build en inglés (`npm run start:en`) | Todos los textos nuevos en inglés | FR-012, SC-005 |
