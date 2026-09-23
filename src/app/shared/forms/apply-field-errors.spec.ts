import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { applyFieldErrors } from './apply-field-errors';

const httpError = (fieldErrors: Record<string, string> | null) =>
  new HttpErrorResponse({
    status: 400,
    error: { timestamp: 't', status: 400, error: 'Bad Request', message: 'x', fieldErrors },
  });

describe('applyFieldErrors', () => {
  const buildForm = () =>
    new FormGroup({ email: new FormControl(''), password: new FormControl('') });

  it('pone el error del backend en cada control y lo marca como tocado (R9)', () => {
    const form = buildForm();

    const applied = applyFieldErrors(form, httpError({ email: 'Formato inválido' }));

    expect(applied).toBe(true);
    expect(form.controls.email.errors).toEqual({ backend: 'Formato inválido' });
    expect(form.controls.email.touched).toBe(true);
    expect(form.controls.password.errors).toBeNull();
  });

  it('ignora los campos que no existen en el formulario', () => {
    const form = buildForm();
    expect(applyFieldErrors(form, httpError({ otro: 'x' }))).toBe(true);
    expect(form.valid).toBe(true);
  });

  it('entrega a otherFields los campos que no son controles', () => {
    const form = buildForm();
    const onFile = vi.fn();

    applyFieldErrors(form, httpError({ file: 'Archivo dañado', email: 'x' }), { file: onFile });

    expect(onFile).toHaveBeenCalledWith('Archivo dañado');
    expect(form.controls.email.errors).toEqual({ backend: 'x' });
  });

  it('devuelve false si el error no trae errores de campo', () => {
    expect(applyFieldErrors(buildForm(), httpError(null))).toBe(false);
    expect(applyFieldErrors(buildForm(), new Error('red'))).toBe(false);
  });
});
