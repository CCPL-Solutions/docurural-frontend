// Textos del botón de descarga de un documento, compartidos por el dashboard y el listado.

export function downloadTooltip(downloading: boolean): string {
  return downloading
    ? $localize`:@@download.button.downloading:Descargando…`
    : $localize`:@@download.button.download:Descargar`;
}

export function downloadAriaLabel(title: string, downloading: boolean): string {
  return downloading
    ? $localize`:@@download.button.downloadingAriaLabel:Descargando documento ${title}:title:`
    : $localize`:@@download.button.downloadAriaLabel:Descargar documento ${title}:title:`;
}
