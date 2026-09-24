import { DocumentFormat } from '@core/models/document-format.model';

/**
 * Intenta extraer el nombre de archivo del header Content-Disposition.
 * Soporta RFC 5987 (filename*=UTF-8''...) con prioridad sobre el formato simple.
 * Retorna null si el header es nulo o no contiene un filename utilizable.
 */
export function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;

  const rfc5987Match = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (rfc5987Match) {
    try {
      return decodeURIComponent(rfc5987Match[1].trim());
    } catch {
      // si falla el decode, continuar al formato simple
    }
  }

  const simpleMatch = header.match(/filename\s*=\s*"?([^";]+)"?/i);
  if (simpleMatch) return simpleMatch[1].trim();

  return null;
}

/**
 * Construye un nombre de archivo de respaldo cuando Content-Disposition no está disponible
 * y el contexto no expone originalFileName (p.ej. la fila del listado).
 */
export function buildFallbackFilename(title: string, format: DocumentFormat): string {
  const slug = title.replace(/[<>:"/\\|?*]/g, '_').trim();
  return `${slug}.${format.toLowerCase()}`;
}

/**
 * Dispara una descarga en el navegador creando un ancla temporal.
 * Revoca la object URL después del click para liberar memoria.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
