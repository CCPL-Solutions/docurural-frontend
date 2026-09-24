import { downloadAriaLabel, downloadTooltip } from './download-labels';

describe('download-labels', () => {
  it('el tooltip cambia mientras se descarga', () => {
    expect(downloadTooltip(false)).toBe('Descargar');
    expect(downloadTooltip(true)).toBe('Descargando…');
  });

  it('la etiqueta accesible incluye el título del documento', () => {
    expect(downloadAriaLabel('Acta 7', false)).toBe('Descargar documento Acta 7');
    expect(downloadAriaLabel('Acta 7', true)).toBe('Descargando documento Acta 7');
  });
});
