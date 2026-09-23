import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '@core/models/api-error.model';

// Única forma de leer el cuerpo de un error HTTP (API-01). Los componentes no acceden a `err.error`.

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

function parseJson(text: string): ApiError | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return isApiError(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Cuerpo de error de la API si la respuesta lo trae como JSON (o como texto JSON). Devuelve `null`
 * si no es un error HTTP, no tiene cuerpo o el cuerpo no es un `ApiError`.
 *
 * Es síncrona: no lee cuerpos `Blob` (descargas). Para esos, `readApiError`.
 */
export function toApiError(err: unknown): ApiError | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const body: unknown = err.error;
  if (isApiError(body)) return body;
  if (typeof body === 'string') return parseJson(body);
  return null;
}

/**
 * Como `toApiError`, pero también lee cuerpos `Blob`: Angular los entrega así cuando la petición
 * pidió `responseType: 'blob'` (descarga y visualización de documentos).
 */
export async function readApiError(err: unknown): Promise<ApiError | null> {
  if (err instanceof HttpErrorResponse && err.error instanceof Blob) {
    try {
      return parseJson(await err.error.text());
    } catch {
      return null;
    }
  }
  return toApiError(err);
}

/** Errores de campo del backend (400 con `fieldErrors`), o `null` si no los hay. */
export function fieldErrorsOf(err: unknown): Record<string, string> | null {
  const fieldErrors = toApiError(err)?.fieldErrors;
  return fieldErrors && Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}
