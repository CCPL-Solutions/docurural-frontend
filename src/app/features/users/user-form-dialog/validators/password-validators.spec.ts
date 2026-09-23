import { FormControl, FormGroup } from '@angular/forms';
import { passwordComplexityValidator } from './password-complexity.validator';
import { passwordMatchValidator } from './password-match.validator';

describe('passwordComplexityValidator', () => {
  const validate = (value: string) => passwordComplexityValidator()(new FormControl(value));

  it('no valida un valor vacío (lo cubre required)', () => {
    expect(validate('')).toBeNull();
  });

  it('acepta una contraseña que cumple todas las reglas', () => {
    expect(validate('Contraseña#2026')).toBeNull();
  });

  it('reporta cada regla incumplida', () => {
    expect(validate('abc')).toEqual({
      minLength: true,
      noUppercase: true,
      noDigit: true,
      noSymbol: true,
    });
  });

  it('rechaza más de 128 caracteres', () => {
    expect(validate(`Aa1!${'x'.repeat(125)}`)).toEqual({ maxLength: true });
  });
});

describe('passwordMatchValidator', () => {
  const group = (password: string, confirmPassword: string) =>
    new FormGroup(
      { password: new FormControl(password), confirmPassword: new FormControl(confirmPassword) },
      { validators: passwordMatchValidator() },
    );

  it('no compara si la contraseña está vacía (edición sin cambio)', () => {
    expect(group('', 'algo').errors).toBeNull();
  });

  it('acepta contraseñas iguales', () => {
    expect(group('Contraseña#2026', 'Contraseña#2026').errors).toBeNull();
  });

  it('marca passwordMismatch si difieren o falta la confirmación', () => {
    expect(group('Contraseña#2026', 'Otra#2026').errors).toEqual({ passwordMismatch: true });
    expect(group('Contraseña#2026', '').errors).toEqual({ passwordMismatch: true });
  });
});
