import {
  buildFallbackFilename,
  parseFilenameFromContentDisposition,
  triggerBlobDownload,
} from './download-blob';

describe('parseFilenameFromContentDisposition', () => {
  it('retorna null si no hay cabecera', () => {
    expect(parseFilenameFromContentDisposition(null)).toBeNull();
  });

  it('retorna null si la cabecera no trae filename', () => {
    expect(parseFilenameFromContentDisposition('inline')).toBeNull();
  });

  it('lee el formato simple con comillas', () => {
    expect(parseFilenameFromContentDisposition('attachment; filename="acta 2026.pdf"')).toBe(
      'acta 2026.pdf',
    );
  });

  it('decodifica el formato RFC 5987', () => {
    expect(
      parseFilenameFromContentDisposition("attachment; filename*=UTF-8''informe%20final.pdf"),
    ).toBe('informe final.pdf');
  });

  it('prioriza RFC 5987 sobre el formato simple', () => {
    const header = `attachment; filename="plano.pdf"; filename*=UTF-8''matr%C3%ADcula.pdf`;
    expect(parseFilenameFromContentDisposition(header)).toBe('matrícula.pdf');
  });

  it('usa el formato simple si RFC 5987 no se puede decodificar', () => {
    const header = `attachment; filename*=UTF-8''roto%E0%A4%A; filename="respaldo.pdf"`;
    expect(parseFilenameFromContentDisposition(header)).toBe('respaldo.pdf');
  });
});

describe('buildFallbackFilename', () => {
  it('sustituye los caracteres no válidos y usa la extensión del formato', () => {
    expect(buildFallbackFilename('Acta: 1/2', 'PDF')).toBe('Acta_ 1_2.pdf');
  });
});

describe('triggerBlobDownload', () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    vi.restoreAllMocks();
  });

  it('crea un enlace temporal, lo pulsa, lo retira y revoca la URL', () => {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    triggerBlobDownload(new Blob(['x']), 'acta.pdf');

    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('acta.pdf');
    expect(anchor.href).toBe('blob:mock');
    expect(anchor.isConnected).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});
