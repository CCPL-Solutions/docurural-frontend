export type DocumentFormat = 'PDF' | 'DOCX' | 'XLSX' | 'JPG' | 'PNG';

export const DOCUMENT_FORMAT_LABELS: Record<DocumentFormat, string> = {
  PDF: 'PDF',
  DOCX: 'Word',
  XLSX: 'Excel',
  JPG: $localize`:@@documentFormat.jpg:Imagen JPG`,
  PNG: $localize`:@@documentFormat.png:Imagen PNG`,
};
