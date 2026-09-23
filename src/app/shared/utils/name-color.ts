// Color determinista a partir de un nombre (categorías, pills y avatares). Es el único módulo que
// calcula el hash de un nombre. Los hex se sustituyen por tokens en la Fase 4 (tarea 4.4).

export interface NameColor {
  bg: string;
  fg: string;
  /** Color sólido del punto de los pills. */
  dot: string;
}

export interface AvatarColor {
  bg: string;
  fg: string;
}

const NAME_PALETTE: readonly NameColor[] = [
  { bg: '#EBF3FB', fg: '#1E4F7A', dot: '#2E6DA4' },
  { bg: '#F3EAF8', fg: '#5B2779', dot: '#8E4FB8' },
  { bg: '#E6F4E7', fg: '#276B2B', dot: '#3A8A3F' },
  { bg: '#FDF3DF', fg: '#8A5E10', dot: '#E8A020' },
  { bg: '#E5F1F7', fg: '#1A5570', dot: '#3A8AAE' },
  { bg: '#FBEAE7', fg: '#8F2A20', dot: '#C0392B' },
  { bg: '#F4F6F8', fg: '#4A5A6E', dot: '#6B7A8D' },
];

const NAME_MUTED: NameColor = { bg: '#EEF1F4', fg: '#9AA8B8', dot: '#9AA8B8' };

const AVATAR_PALETTE: readonly string[] = [
  '#2E6DA4',
  '#3A8A3F',
  '#8E4FB8',
  '#3A8AAE',
  '#E8A020',
  '#1E4F7A',
  '#5B6E84',
];

const AVATAR_MUTED: AvatarColor = { bg: '#E5EAF0', fg: '#9AA8B8' };

/** Índice estable en `[0, size)` para un nombre. */
function nameIndex(name: string | null | undefined, size: number): number {
  const safe = name ?? '';
  let h = 0;
  for (let i = 0; i < safe.length; i++) {
    h = (h * 31 + safe.charCodeAt(i)) % size;
  }
  return h;
}

/** Colores de categoría (fondo, texto y punto). `muted` devuelve la variante apagada. */
export function nameColor(name: string | null | undefined, muted = false): NameColor {
  if (muted) return NAME_MUTED;
  return NAME_PALETTE[nameIndex(name, NAME_PALETTE.length)];
}

/** Colores de avatar: el color base como texto y el mismo con transparencia como fondo. */
export function avatarColor(name: string | null | undefined, muted = false): AvatarColor {
  if (muted) return AVATAR_MUTED;
  const base = AVATAR_PALETTE[nameIndex(name, AVATAR_PALETTE.length)];
  return { bg: `${base}22`, fg: base };
}
