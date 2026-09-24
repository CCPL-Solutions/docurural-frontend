// Color determinista a partir de un nombre (categorías, pills y avatares). Es el único módulo que
// calcula el hash de un nombre. Los colores son tokens de src/styles/_tokens.scss (D29).

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

const token = (name: string): string => `var(--color-${name})`;

/** Familia de acento: fondo claro, texto sobre el fondo y color base. */
const family = (bg: string, fg: string, dot: string): NameColor => ({
  bg: token(bg),
  fg: token(fg),
  dot: token(dot),
});

const NAME_PALETTE: readonly NameColor[] = [
  family('primary-light', 'primary-dark', 'primary'),
  family('purple-light', 'purple-text', 'purple'),
  family('success-light', 'success-text', 'success'),
  family('warning-light', 'warning-text', 'warning'),
  family('teal-light', 'teal-text', 'teal'),
  family('error-light', 'error-text', 'error'),
  family('bg-app', 'neutral', 'text-secondary'),
];

const NAME_MUTED = family('neutral-light', 'text-muted', 'text-muted');

const AVATAR_PALETTE: readonly string[] = [
  'primary',
  'success',
  'purple',
  'teal',
  'warning',
  'primary-dark',
  'text-secondary',
].map(token);

const AVATAR_MUTED: AvatarColor = { bg: token('divider'), fg: token('text-muted') };

/** Opacidad del fondo del avatar sobre su color base (antes, el sufijo hex `22`). */
const AVATAR_BG_OPACITY = '13%';

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

/** Colores de avatar: el color base como texto y el mismo, translúcido, como fondo. */
export function avatarColor(name: string | null | undefined, muted = false): AvatarColor {
  if (muted) return AVATAR_MUTED;
  const base = AVATAR_PALETTE[nameIndex(name, AVATAR_PALETTE.length)];
  return { bg: `color-mix(in srgb, ${base} ${AVATAR_BG_OPACITY}, transparent)`, fg: base };
}
