import { TestBed } from '@angular/core/testing';
import { ApproverBadgeComponent } from './approver-badge.component';

describe('ApproverBadgeComponent', () => {
  async function render(inactive: boolean) {
    const fixture = TestBed.createComponent(ApproverBadgeComponent);
    fixture.componentRef.setInput('inactive', inactive);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    return { badge: host.querySelector('.badge')!, hidden: host.querySelector('.visually-hidden') };
  }

  it('muestra "Aprobador" con la variante de acento', async () => {
    const { badge, hidden } = await render(false);

    expect(badge.textContent).toContain('Aprobador');
    expect(badge.classList).toContain('badge--accent');
    expect(hidden).toBeNull();
  });

  it('si está inactivo, se atenúa y explica que no cuenta como aprobador activo', async () => {
    const { badge, hidden } = await render(true);

    expect(badge.classList).toContain('badge--neutral');
    expect(hidden?.textContent).toContain('Inactivo: no cuenta como aprobador activo');
  });
});
