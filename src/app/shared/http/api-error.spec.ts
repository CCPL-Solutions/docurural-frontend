import { HttpErrorResponse } from '@angular/common/http';
import { fieldErrorsOf, readApiError, toApiError } from './api-error';

const apiError = { timestamp: 't', status: 400, error: 'Bad Request', message: 'Datos inválidos' };
const httpError = (error: unknown, status = 400) => new HttpErrorResponse({ error, status });

describe('toApiError', () => {
  it('devuelve el cuerpo JSON de un error HTTP', () => {
    expect(toApiError(httpError(apiError))).toEqual(apiError);
  });

  it('interpreta un cuerpo de texto con JSON', () => {
    expect(toApiError(httpError(JSON.stringify(apiError)))).toEqual(apiError);
  });

  it('devuelve null si no hay un ApiError', () => {
    expect(toApiError(httpError(null))).toBeNull();
    expect(toApiError(httpError('Bad Gateway'))).toBeNull();
    expect(toApiError(httpError({ foo: 1 }))).toBeNull();
    expect(toApiError(new Error('x'))).toBeNull();
    expect(toApiError(undefined)).toBeNull();
  });

  it('no lee cuerpos Blob (para eso está readApiError)', () => {
    expect(toApiError(httpError(new Blob([JSON.stringify(apiError)])))).toBeNull();
  });
});

describe('readApiError', () => {
  it('lee un cuerpo Blob con JSON', async () => {
    const blob = new Blob([JSON.stringify(apiError)], { type: 'application/json' });
    await expect(readApiError(httpError(blob, 404))).resolves.toEqual(apiError);
  });

  it('devuelve null si el Blob no es JSON', async () => {
    await expect(readApiError(httpError(new Blob(['<html>'])))).resolves.toBeNull();
  });

  it('usa toApiError con cuerpos que no son Blob', async () => {
    await expect(readApiError(httpError(apiError))).resolves.toEqual(apiError);
  });
});

describe('fieldErrorsOf', () => {
  it('devuelve los errores de campo del cuerpo', () => {
    const body = { ...apiError, fieldErrors: { email: 'Ya existe' } };
    expect(fieldErrorsOf(httpError(body))).toEqual({ email: 'Ya existe' });
  });

  it('devuelve null si no hay errores de campo', () => {
    expect(fieldErrorsOf(httpError(apiError))).toBeNull();
    expect(fieldErrorsOf(httpError({ ...apiError, fieldErrors: {} }))).toBeNull();
    expect(fieldErrorsOf(httpError({ ...apiError, fieldErrors: null }))).toBeNull();
  });
});
