import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { jwtInterceptor } from '@core/interceptors/jwt.interceptor';
import { AuthService } from '@core/services/auth.service';
import { APP_DATE_FORMATS } from '@shared/utils/date-formats';

// Idioma de la aplicación: lo usan el pipe `date` y `formatDate` (Fase 8: un build por idioma).
registerLocaleData(localeEsCO);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimationsAsync(),
    provideAppInitializer(() => inject(AuthService).hydrate()),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    provideNativeDateAdapter(APP_DATE_FORMATS),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
  ],
};
