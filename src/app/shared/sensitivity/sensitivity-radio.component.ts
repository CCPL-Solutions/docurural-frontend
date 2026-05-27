import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  SensitivityLevel,
  SENSITIVITY_ACCESS_HINTS,
  SENSITIVITY_DESCRIPTIONS,
  SENSITIVITY_ICONS,
  SENSITIVITY_LABELS,
  SENSITIVITY_LEVELS,
  compareSensitivity,
} from '../../core/models/sensitivity-level.model';

@Component({
  selector: 'app-sensitivity-radio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  providers: [
    {
      provide:     NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SensitivityRadioComponent),
      multi:       true,
    },
  ],
  templateUrl: './sensitivity-radio.component.html',
  styleUrl:    './sensitivity-radio.component.scss',
})
export class SensitivityRadioComponent implements ControlValueAccessor {
  readonly minLevel   = input<SensitivityLevel>('INTERNAL');
  readonly editorRole = input(false);
  readonly locked     = input(false);
  readonly compact    = input(false);

  protected readonly _value          = signal<SensitivityLevel>('INTERNAL');
  protected readonly isFormDisabled  = signal(false);

  protected readonly levels       = SENSITIVITY_LEVELS;
  protected readonly labels       = SENSITIVITY_LABELS;
  protected readonly descriptions = SENSITIVITY_DESCRIPTIONS;
  protected readonly accessHints  = SENSITIVITY_ACCESS_HINTS;
  protected readonly icons        = SENSITIVITY_ICONS;

  private onChange: (value: SensitivityLevel) => void = () => {};
  private onTouched: () => void                       = () => {};

  protected isDisabledLevel(level: SensitivityLevel): boolean {
    if (this.locked() || this.isFormDisabled())  return true;
    if (compareSensitivity(level, this.minLevel()) < 0) return true;
    if (this.editorRole() && (level === 'RESTRICTED' || level === 'CONFIDENTIAL')) return true;
    return false;
  }

  protected isBelowMin(level: SensitivityLevel): boolean {
    return compareSensitivity(level, this.minLevel()) < 0;
  }

  protected isEditorLocked(level: SensitivityLevel): boolean {
    return this.editorRole() && (level === 'RESTRICTED' || level === 'CONFIDENTIAL');
  }

  protected select(level: SensitivityLevel): void {
    if (this.isDisabledLevel(level)) return;
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
