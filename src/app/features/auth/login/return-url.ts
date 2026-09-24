const DEFAULT_RETURN_URL = '/dashboard';

/**
 * Destino tras iniciar sesión. Solo acepta rutas internas: una URL absoluta o una ruta que empieza
 * por `//` o `/\` (que el navegador trata como otro dominio) se descartan (R7).
 */
export function safeReturnUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return DEFAULT_RETURN_URL;
  }
  return raw;
}
