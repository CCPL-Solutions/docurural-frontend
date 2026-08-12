export type SensitivityLevel = 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL';

export const SENSITIVITY_LEVELS: readonly SensitivityLevel[] = [
  'INTERNAL',
  'RESTRICTED',
  'CONFIDENTIAL',
];

export const SENSITIVITY_LABELS: Record<SensitivityLevel, string> = {
  INTERNAL: 'Público interno',
  RESTRICTED: 'Restringido',
  CONFIDENTIAL: 'Confidencial',
};

export const SENSITIVITY_SHORT_LABELS: Record<SensitivityLevel, string> = {
  INTERNAL: 'Interno',
  RESTRICTED: 'Restringido',
  CONFIDENTIAL: 'Confidencial',
};

export const SENSITIVITY_DESCRIPTIONS: Record<SensitivityLevel, string> = {
  INTERNAL: 'Documentos de uso general entre el personal de la institución.',
  RESTRICTED: 'Documentos con datos personales de estudiantes o familias (Ley 1581/2012).',
  CONFIDENTIAL: 'Documentos de uso exclusivo de la rectoría. Acceso reservado.',
};

export const SENSITIVITY_ACCESS_HINTS: Record<SensitivityLevel, string> = {
  INTERNAL: 'Accesible para administradores, editores y lectores.',
  RESTRICTED: 'Accesible exclusivamente para administradores.',
  CONFIDENTIAL: 'Accesible exclusivamente para administradores.',
};

// Material Icons equivalentes a globe / shield-alert / lock del handoff
export const SENSITIVITY_ICONS: Record<SensitivityLevel, string> = {
  INTERNAL: 'public',
  RESTRICTED: 'verified_user',
  CONFIDENTIAL: 'lock',
};

export function getLevelIndex(level: SensitivityLevel): number {
  return SENSITIVITY_LEVELS.indexOf(level);
}

export function compareSensitivity(a: SensitivityLevel, b: SensitivityLevel): -1 | 0 | 1 {
  const diff = getLevelIndex(a) - getLevelIndex(b);
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return 0;
}

export function isAtLeast(value: SensitivityLevel, min: SensitivityLevel): boolean {
  return getLevelIndex(value) >= getLevelIndex(min);
}

export function clampToMin(value: SensitivityLevel, min: SensitivityLevel): SensitivityLevel {
  return isAtLeast(value, min) ? value : min;
}
