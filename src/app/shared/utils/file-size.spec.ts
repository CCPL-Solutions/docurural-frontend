import { formatFileSize } from './file-size';

describe('formatFileSize', () => {
  it('muestra bytes por debajo de 1 KB', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('muestra KB redondeados por debajo de 1 MB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('2 KB');
  });

  it('muestra MB con un decimal', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatFileSize(10.25 * 1024 * 1024)).toBe('10.3 MB');
  });
});
