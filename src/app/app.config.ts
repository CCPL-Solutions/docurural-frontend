import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';
import { jwtInterceptor } from '@core/interceptors/jwt.interceptor';
import { AuthService } from '@core/services/auth.service';
import { APP_DATE_FORMATS } from '@shared/utils/date-formats';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimationsAsync(),
    provideAppInitializer(() => inject(AuthService).hydrate()),
    // LOCALE_ID (y con él MAT_DATE_LOCALE, el pipe `date` y `formatDate`) lo fija el build de cada
    // idioma con @angular/localize, junto con los datos del idioma (i18n en angular.json).
    provideNativeDateAdapter(APP_DATE_FORMATS),
  ],
};
