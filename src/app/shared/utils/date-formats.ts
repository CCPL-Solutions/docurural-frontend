import { MatDateFormats } from '@angular/material/core';

// Formatos de fecha de la aplicación. Los de pantalla se usan con el pipe `date` o `formatDate`,
// que toman el idioma de `LOCALE_ID` (lo fija el build de cada idioma). Los patrones se traducen
// porque el orden y los literales (`'de'`) cambian con el idioma. El pipe interpreta las fechas `YYYY-MM-DD`
// como fecha local, lo que evita el desfase de un día en Colombia (R11).

/** 01/03/2026 */
export const DATE_FORMAT = $localize`:@@dateFormat.date:dd/MM/y`;
/** 01/03/2026, 05:30 p. m. */
export const DATE_TIME_FORMAT = $localize`:@@dateFormat.dateTime:dd/MM/y, hh:mm a`;
/** 01/03/2026, 17:30 */
export const DATE_TIME_24H_FORMAT = $localize`:@@dateFormat.dateTime24h:dd/MM/y, HH:mm`;
/** 1 de mar de 2026 */
export const SHORT_DATE_FORMAT = $localize`:@@dateFormat.shortDate:d 'de' MMM 'de' y`;
/** marzo de 2026 */
export const MONTH_YEAR_FORMAT = $localize`:@@dateFormat.monthYear:MMMM 'de' y`;

/** Formatos de los datepickers de Material (adaptador nativo, opciones de `Intl`). */
export const APP_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: { day: 'numeric', month: 'numeric', year: 'numeric' },
  },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};
