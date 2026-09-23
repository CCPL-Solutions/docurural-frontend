import { DocumentFormat } from '@core/models/document-format.model';

export interface FormatStyle {
  bg: string;
  fg: string;
  dot: string;
  matIcon: string;
}

/** Estilo de una familia de color de _tokens.scss: fondo claro, texto y color base. */
function formatStyle(familyName: string, matIcon: string): FormatStyle {
  return {
    bg: `var(--color-${familyName}-light)`,
    fg: `var(--color-${familyName}-text)`,
    dot: `var(--color-${familyName})`,
    matIcon,
  };
}

export const FORMAT_STYLE: Record<DocumentFormat, FormatStyle> = {
  PDF: formatStyle('error', 'description'),
  DOCX: { ...formatStyle('primary', 'description'), fg: 'var(--color-primary-dark)' },
  XLSX: formatStyle('success', 'table_chart'),
  JPG: formatStyle('purple', 'image'),
  PNG: formatStyle('warning', 'image'),
};

const FORMAT_BY_EXTENSION = new Map<string, DocumentFormat>([
  ['pdf', 'PDF'],
  ['docx', 'DOCX'],
  ['xlsx', 'XLSX'],
  ['jpg', 'JPG'],
  ['jpeg', 'JPG'],
  ['png', 'PNG'],
]);

/** Formato a partir de la extensión del archivo. Si no se reconoce, `PDF`. */
export function inferFormat(filename: string): DocumentFormat {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return FORMAT_BY_EXTENSION.get(ext) ?? 'PDF';
}
