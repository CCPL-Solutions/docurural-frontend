import { TestBed } from '@angular/core/testing';
import { DocumentEmptyResultsComponent } from './document-empty-results.component';

describe('DocumentEmptyResultsComponent', () => {
  async function render(variant: 'search' | 'filters' | 'combined', searchTerm: string | null) {
    const fixture = TestBed.createComponent(DocumentEmptyResultsComponent);
    fixture.componentRef.setInput('variant', variant);
    fixture.componentRef.setInput('searchTerm', searchTerm);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      title: host.querySelector('h3')?.textContent,
      message: host.querySelector('p')?.textContent,
      icon: host.querySelector('mat-icon')?.textContent,
      button: host.querySelector('button')!,
    };
  }

  it('búsqueda: repite el término buscado', async () => {
    const { title, message, icon } = await render('search', 'acta');

    expect(title).toBe('No se encontraron documentos');
    expect(message).toContain('que coincidan con "acta"');
    expect(icon).toBe('search_off');
  });

  it('búsqueda sin término: mensaje genérico', async () => {
    const { message } = await render('search', null);

    expect(message).toBe('No se encontraron documentos. Intente con otras palabras clave.');
  });

  it('filtros', async () => {
    const { title, message, icon } = await render('filters', null);

    expect(title).toBe('Sin documentos con los filtros aplicados');
    expect(message).toBe('No hay documentos que coincidan con los filtros aplicados.');
    expect(icon).toBe('filter_alt_off');
  });

  it('búsqueda y filtros, con acción para limpiar todo', async () => {
    const { fixture, title, message, button } = await render('combined', 'acta');
    const clearAll = vi.fn();
    fixture.componentInstance.clearAll.subscribe(clearAll);

    button.click();

    expect(title).toBe('Sin resultados para la búsqueda y los filtros');
    expect(message).toContain('la búsqueda y los filtros aplicados');
    expect(clearAll).toHaveBeenCalledOnce();
  });
});
