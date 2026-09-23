import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@core/models/user-form.model';

export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '') as string;
    if (!value) return null;

    const errors: ValidationErrors = {};
    if (value.length < MIN_PASSWORD_LENGTH) errors['minLength'] = true;
    if (value.length > MAX_PASSWORD_LENGTH) errors['maxLength'] = true;
    if (!/[a-z]/.test(value)) errors['noLowercase'] = true;
    if (!/[A-Z]/.test(value)) errors['noUppercase'] = true;
    if (!/\d/.test(value)) errors['noDigit'] = true;
    if (!/[^A-Za-z\d]/.test(value)) errors['noSymbol'] = true;

    return Object.keys(errors).length ? errors : null;
  };
}
