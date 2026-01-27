// noinspection JSUnusedGlobalSymbols

/**
 * Verifica si un string es null, undefined o vacío.
 */
export function isEmpty(str: string | null | undefined): boolean {
  return (str ?? '') === '';
}

/**
 * Verifica si un string es null, undefined, vacío o solo whitespace.
 */
export function isBlank(str: string | null | undefined): boolean {
  return (str ?? '').trim() === '';
}

/**
 * Verifica si un string tiene contenido (no es null, undefined ni vacío).
 * Type guard para asegurar que str es string.
 */
export function isNotEmpty(str: string | null | undefined): str is string {
  return !isEmpty(str);
}

/**
 * Verifica si un string tiene contenido (no es null, undefined, vacío ni solo whitespace).
 * Type guard para asegurar que str es string.
 */
export function isNotBlank(str: string | null | undefined): str is string {
  return !isBlank(str);
}
