import { MatDialogConfig } from '@angular/material/dialog';

// Tamaños de diálogo con nombre (D32). Se combinan con los datos al abrir:
// `dialog.open(Componente, { ...DIALOG_LG, data })`.

const DIALOG_BASE = {
  // En pantallas estrechas el diálogo ocupa el ancho disponible con un pequeño margen.
  maxWidth: '95vw',
  autoFocus: 'first-tabbable',
} as const satisfies MatDialogConfig;

/** Confirmaciones cortas (activar o desactivar). */
export const DIALOG_SM = { ...DIALOG_BASE, width: '400px' } as const satisfies MatDialogConfig;
/** Formularios cortos y confirmaciones con detalle (usuario, eliminar documento). */
export const DIALOG_MD = { ...DIALOG_BASE, width: '480px' } as const satisfies MatDialogConfig;
/** Formularios completos (categoría, subir o editar documento). */
export const DIALOG_LG = { ...DIALOG_BASE, width: '620px' } as const satisfies MatDialogConfig;
/** Subida en lote. */
export const DIALOG_XL = { ...DIALOG_BASE, width: '720px' } as const satisfies MatDialogConfig;
