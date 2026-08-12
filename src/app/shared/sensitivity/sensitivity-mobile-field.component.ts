import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  SensitivityLevel,
  SENSITIVITY_ICONS,
  SENSITIVITY_LABELS,
  SENSITIVITY_LEVELS,
  compareSensitivity,
} from '../../core/models/sensitivity-level.model';

@Component({
  selector: 'app-sensitivity-mobile-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SensitivityMobileFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './sensitivity-mobile-field.component.html',
  styleUrl: './sensitivity-mobile-field.component.scss',
})
export class SensitivityMobileFieldComponent implements ControlValueAccessor {
  readonly minLevel = input<SensitivityLevel>('INTERNAL');
  readonly editorRole = input(false);
  readonly locked = input(false);

  protected readonly _value = signal<SensitivityLevel>('INTERNAL');
  protected readonly isFormDisabled = signal(false);

  protected readonly levels = SENSITIVITY_LEVELS;
  protected readonly labels = SENSITIVITY_LABELS;
  protected readonly icons = SENSITIVITY_ICONS;

  private onChange: (value: SensitivityLevel) => void = () => {};
  private onTouched: () => void = () => {};

  protected isOptionDisabled(level: SensitivityLevel): boolean {
    if (compareSensitivity(level, this.minLevel()) < 0) return true;
    if (this.editorRole() && (level === 'RESTRICTED' || level === 'CONFIDENTIAL')) return true;
    return false;
  }

  protected onValueChange(level: SensitivityLevel): void {
    this._value.set(level);
    this.onChange(level);
    this.onTouched();
  }

  writeValue(value: SensitivityLevel): void {
    this._value.set(value ?? 'INTERNAL');
  }

  registerOnChange(fn: (value: SensitivityLevel) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isFormDisabled.set(isDisabled);
  }
}
