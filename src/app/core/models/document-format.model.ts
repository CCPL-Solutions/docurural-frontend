export type DocumentFormat = 'PDF' | 'DOCX' | 'XLSX' | 'JPG' | 'PNG';

export const DOCUMENT_FORMAT_LABELS: Record<DocumentFormat, string> = {
  PDF: 'PDF',
  DOCX: 'Word',
  XLSX: 'Excel',
  JPG: 'Imagen JPG',
  PNG: 'Imagen PNG',
};
