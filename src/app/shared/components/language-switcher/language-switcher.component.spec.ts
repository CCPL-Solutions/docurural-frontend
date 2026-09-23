import { APP_BASE_HREF } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LanguageSwitcherComponent } from './language-switcher.component';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class BlankComponent {}

describe('LanguageSwitcherComponent', () => {
  async function render(localeId: string, baseHref: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: BlankComponent }]),
        { provide: LOCALE_ID, useValue: localeId },
        { provide: APP_BASE_HREF, useValue: baseHref },
      ],
    });
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    await fixture.whenStable();
    return fixture;
  }

  const links = (host: HTMLElement) => Array.from(host.querySelectorAll('a'));

  it('en el build en español enlaza la misma página en inglés', async () => {
    const fixture = await render('es-CO', '/es/');
    await TestBed.inject(Router).navigateByUrl('/documents/7?tab=info');
    await fixture.whenStable();

    const [link, ...rest] = links(fixture.nativeElement);
    expect(rest).toHaveLength(0);
    expect(link.getAttribute('href')).toBe('/en/documents/7?tab=info');
    expect(link.getAttribute('hreflang')).toBe('en');
    expect(link.textContent).toContain('English');
  });

  it('en el build en inglés enlaza la versión en español', async () => {
    const fixture = await render('en', '/en/');
    await TestBed.inject(Router).navigateByUrl('/login');
    await fixture.whenStable();

    const [link] = links(fixture.nativeElement);
    expect(link.getAttribute('href')).toBe('/es/login');
    expect(link.textContent).toContain('Español');
  });

  it('con un único idioma servido en la raíz (ng serve) no muestra nada', async () => {
    const fixture = await render('es-CO', '/');

    expect(links(fixture.nativeElement)).toHaveLength(0);
  });
});
