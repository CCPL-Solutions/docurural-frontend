import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { fieldErrorMessage } from './field-error';
import { FieldErrorComponent } from './field-error.component';

const MESSAGES = { required: 'Obligatorio', email: 'Correo inválido', mismatch: 'No coinciden' };

describe('fieldErrorMessage', () => {
  it('no muestra nada si el control no está tocado', () => {
    expect(fieldErrorMessage(new FormControl('', Validators.required), MESSAGES)).toBeNull();
  });

  it('muestra el primer error según el orden de los mensajes', () => {
    const control = new FormControl('', [Validators.required, Validators.email]);
    control.markAsTouched();
    expect(fieldErrorMessage(control, MESSAGES)).toBe('Obligatorio');

    control.setValue('x');
    expect(fieldErrorMessage(control, MESSAGES)).toBe('Correo inválido');
  });

  it('muestra el texto del error backend', () => {
    const control = new FormControl('a@b.co');
    control.setErrors({ backend: 'Ya existe' });
    control.markAsTouched();
    expect(fieldErrorMessage(control, MESSAGES)).toBe('Ya existe');
  });

  it('muestra los errores de grupo aunque el control sea válido', () => {
    const mismatch = (): ValidationErrors => ({ mismatch: true });
    const group = new FormGroup({ confirm: new FormControl('x') }, { validators: mismatch });
    group.controls.confirm.markAsTouched();

    expect(fieldErrorMessage(group.controls.confirm, MESSAGES)).toBeNull();
    expect(fieldErrorMessage(group.controls.confirm, MESSAGES, ['mismatch'])).toBe('No coinciden');
  });

  it('devuelve null si el control es válido', () => {
    const control = new FormControl('ok', Validators.required);
    control.markAsTouched();
    expect(fieldErrorMessage(control, MESSAGES)).toBeNull();
  });
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldErrorComponent],
  template: `<app-field-error [control]="control" [messages]="messages" />`,
})
class HostComponent {
  readonly control = new FormControl('', Validators.required);
  readonly messages = MESSAGES;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldErrorComponent],
  template: `
    <app-field-error [control]="control" [messages]="messages" errorId="email-error">
      <small class="field__hint">Ayuda</small>
    </app-field-error>
  `,
})
class HintHostComponent {
  readonly control = new FormControl('', Validators.required);
  readonly messages = MESSAGES;
}

describe('FieldErrorComponent', () => {
  it('aparece al tocar el control y desaparece al corregirlo (OnPush, sin zone)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const text = () => (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
    expect(text()).toBe('');

    fixture.componentInstance.control.markAsTouched();
    await fixture.whenStable();
    expect(text()).toContain('Obligatorio');

    fixture.componentInstance.control.setValue('valor');
    await fixture.whenStable();
    expect(text()).toBe('');
  });

  it('muestra el contenido proyectado mientras no hay error, y el id del mensaje', async () => {
    const fixture = TestBed.createComponent(HintHostComponent);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.field__hint')?.textContent).toBe('Ayuda');

    fixture.componentInstance.control.markAsTouched();
    await fixture.whenStable();
    expect(host.querySelector('.field__hint')).toBeNull();
    expect(host.querySelector('#email-error')?.textContent).toContain('Obligatorio');
  });

  it('muestra el error backend al aplicarlo', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const { control } = fixture.componentInstance;
    control.setValue('x');
    control.setErrors({ backend: 'Rechazado por el servidor' });
    control.markAsTouched();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Rechazado por el servidor',
    );
  });
});
