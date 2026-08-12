import { DocumentFormat } from '../../../../core/models/document-format.model';

export interface FormatStyle {
  bg: string;
  fg: string;
  dot: string;
  matIcon: string;
}

export const FORMAT_STYLE: Record<DocumentFormat, FormatStyle> = {
  PDF: { bg: '#FBEAE7', fg: '#8F2A20', dot: '#C0392B', matIcon: 'description' },
  DOCX: { bg: '#EBF3FB', fg: '#1E4F7A', dot: '#2E6DA4', matIcon: 'description' },
  XLSX: { bg: '#E6F4E7', fg: '#276B2B', dot: '#3A8A3F', matIcon: 'table_chart' },
  JPG: { bg: '#F3EAF8', fg: '#5B2779', dot: '#8E4FB8', matIcon: 'image' },
  PNG: { bg: '#FDF3DF', fg: '#8A5E10', dot: '#E8A020', matIcon: 'image' },
};
