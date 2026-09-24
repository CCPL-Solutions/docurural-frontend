/** Iniciales en mayúsculas de las dos primeras palabras de un nombre. */
export function userInitials(fullName: string | null | undefined): string {
  return (fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
