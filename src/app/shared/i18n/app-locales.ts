// Idiomas de la aplicación. Debe coincidir con `i18n` de angular.json: cada idioma es un build
// propio servido bajo `/<subPath>/` (Nginx en docurural-infra-test), así que cambiar de idioma
// recarga la página.

export interface AppLocale {
  /** Valor de `LOCALE_ID` en el build de ese idioma. */
  code: string;
  /** Carpeta del build y prefijo de la URL. */
  subPath: string;
  /** Nombre del idioma en ese mismo idioma: no se traduce. */
  label: string;
}

export const APP_LOCALES: readonly AppLocale[] = [
  { code: 'es-CO', subPath: 'es', label: 'Español' },
  { code: 'en', subPath: 'en', label: 'English' },
];
