import { FormControl } from '@angular/forms';
import { trimmedMinLength } from './validators';

describe('trimmedMinLength', () => {
  const validate = (value: string | null) => trimmedMinLength(3)(new FormControl(value));

  it('acepta valores con la longitud mínima sin contar espacios exteriores', () => {
    expect(validate('abc')).toBeNull();
    expect(validate('  abc  ')).toBeNull();
    expect(validate('a b')).toBeNull();
  });

  it('rechaza valores que solo alcanzan el mínimo con espacios', () => {
    expect(validate('  ab  ')).toEqual({ minlength: { requiredLength: 3, actualLength: 2 } });
    expect(validate('   ')).toEqual({ minlength: { requiredLength: 3, actualLength: 0 } });
  });

  it('trata null como cadena vacía', () => {
    expect(validate(null)).toEqual({ minlength: { requiredLength: 3, actualLength: 0 } });
  });
});
