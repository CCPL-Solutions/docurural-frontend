import { TestBed } from '@angular/core/testing';
import { CategoryApprovalBadgeComponent } from './category-approval-badge.component';

describe('CategoryApprovalBadgeComponent', () => {
  async function render(inputs: {
    requiresApproval: boolean;
    size?: 'md' | 'sm';
    muted?: boolean;
  }) {
    const fixture = TestBed.createComponent(CategoryApprovalBadgeComponent);
    fixture.componentRef.setInput('requiresApproval', inputs.requiresApproval);
    if (inputs.size) fixture.componentRef.setInput('size', inputs.size);
    if (inputs.muted !== undefined) fixture.componentRef.setInput('muted', inputs.muted);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    return {
      text: () => host.querySelector('.badge')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      badge: () => host.querySelector('.badge')!,
      icon: () => host.querySelector('mat-icon'),
    };
  }

  it('"Sí" destacado cuando la categoría requiere aprobación', async () => {
    const { text, badge, icon } = await render({ requiresApproval: true });

    expect(text()).toBe('Sí');
    expect(badge().classList).toContain('badge--primary');
    expect(icon()).toBeNull();
  });

  it('"No" neutro cuando no la requiere', async () => {
    const { text, badge } = await render({ requiresApproval: false });

    expect(text()).toBe('No');
    expect(badge().classList).toContain('badge--neutral');
  });

  it('en tamaño sm dice "Aprobación: Sí/No" con icono decorativo', async () => {
    const on = await render({ requiresApproval: true, size: 'sm' });
    expect(on.text()).toContain('Aprobación: Sí');
    expect(on.icon()?.textContent?.trim()).toBe('approval');
    expect(on.icon()?.getAttribute('aria-hidden')).toBe('true');
    TestBed.resetTestingModule();

    const off = await render({ requiresApproval: false, size: 'sm' });
    expect(off.text()).toContain('Aprobación: No');
  });

  it('atenuado (categoría inactiva): variante neutra sin perder el valor', async () => {
    const { text, badge } = await render({ requiresApproval: true, muted: true });

    expect(text()).toBe('Sí');
    expect(badge().classList).toContain('badge--neutral');
  });
});
