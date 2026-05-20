import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '') as string;
    if (!value) return null;

    const errors: ValidationErrors = {};
    if (value.length < 12) errors['minLength'] = true;
    if (value.length > 128) errors['maxLength'] = true;
    if (!/[a-z]/.test(value)) errors['noLowercase'] = true;
    if (!/[A-Z]/.test(value)) errors['noUppercase'] = true;
    if (!/\d/.test(value)) errors['noDigit'] = true;
    if (!/[^A-Za-z\d]/.test(value)) errors['noSymbol'] = true;

    return Object.keys(errors).length ? errors : null;
  };
}
