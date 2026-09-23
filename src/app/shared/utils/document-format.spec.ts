import { FORMAT_STYLE, inferFormat } from './document-format';

describe('inferFormat', () => {
  it('reconoce las extensiones admitidas sin distinguir mayúsculas', () => {
    expect(inferFormat('acta.pdf')).toBe('PDF');
    expect(inferFormat('informe.DOCX')).toBe('DOCX');
    expect(inferFormat('notas.xlsx')).toBe('XLSX');
    expect(inferFormat('foto.jpeg')).toBe('JPG');
    expect(inferFormat('foto.JPG')).toBe('JPG');
    expect(inferFormat('plano.png')).toBe('PNG');
  });

  it('usa PDF si la extensión no se reconoce o no hay extensión', () => {
    expect(inferFormat('archivo.txt')).toBe('PDF');
    expect(inferFormat('archivo')).toBe('PDF');
    expect(inferFormat('archivo.constructor')).toBe('PDF');
  });
});

describe('FORMAT_STYLE', () => {
  it('define un estilo para cada formato', () => {
    expect(Object.keys(FORMAT_STYLE).sort()).toEqual(['DOCX', 'JPG', 'PDF', 'PNG', 'XLSX']);
  });
});
