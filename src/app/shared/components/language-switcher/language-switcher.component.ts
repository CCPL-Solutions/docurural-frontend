import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject } from '@angular/core';
import { LocationStrategy } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { APP_LOCALES, AppLocale } from '@shared/i18n/app-locales';

/**
 * Enlaces a los demás idiomas, en la misma página. Cada idioma es otro build (otra `<base href>`),
 * así que es un `href` con recarga y no un `routerLink`. Solo se muestra cuando la aplicación se
 * sirve bajo la carpeta de su idioma (`/es/`, `/en/`): con `ng serve` hay un único idioma.
 */
@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @for (link of links(); track link.locale.subPath) {
      <a
        class="language-switcher"
        [href]="link.href"
        [attr.hreflang]="link.locale.code"
        [attr.lang]="link.locale.code"
      >
        <mat-icon aria-hidden="true">translate</mat-icon>
        {{ link.locale.label }}
      </a>
    }
  `,
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly router = inject(Router);
  private readonly localeId = inject(LOCALE_ID);
  private readonly baseHref = inject(LocationStrategy).getBaseHref();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly current = APP_LOCALES.find((locale) => locale.code === this.localeId);

  protected readonly links = computed<{ locale: AppLocale; href: string }[]>(() => {
    if (!this.current || this.baseHref !== `/${this.current.subPath}/`) return [];
    return APP_LOCALES.filter((locale) => locale !== this.current).map((locale) => ({
      locale,
      href: `/${locale.subPath}${this.url()}`,
    }));
  });
}
