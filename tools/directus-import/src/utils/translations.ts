/**
 * Translation utilities for Directus imports.
 *
 * Handles the complex logic of preserving translation IDs during updates
 * to avoid creating duplicate translations.
 */

/**
 * Existing translation from Directus
 */
export interface ExistingTranslation {
  id: number;
  languages_code: string;
}

/**
 * Translation request for Directus API
 */
export interface TranslationRequest {
  id?: number;
  languages_code: string;
  name: string;
}

/**
 * Build translation requests for updating an entity.
 *
 * This function handles the complex logic of:
 * 1. Preserving existing translation IDs (to update instead of create)
 * 2. Creating new translations for language codes that don't exist yet
 * 3. Avoiding duplicate translations
 *
 * @param languageCodes - Language codes to generate translations for (e.g., ['es-ES', 'ca-ES'])
 * @param newTranslations - New translation content keyed by language code
 * @param existingTranslations - Existing translations from Directus (with IDs)
 * @returns Array of translation requests ready for Directus API
 *
 * @example
 * // Update existing translations
 * buildTranslationRequests(
 *   ['es-ES', 'ca-ES'],
 *   { 'es-ES': 'Hola', 'ca-ES': 'Hola' },
 *   [{ id: 1, languages_code: 'es-ES' }, { id: 2, languages_code: 'ca-ES' }]
 * )
 * // Returns: [{ id: 1, languages_code: 'es-ES', name: 'Hola' }, { id: 2, languages_code: 'ca-ES', name: 'Hola' }]
 *
 * @example
 * // Create new translation (ca-ES doesn't exist)
 * buildTranslationRequests(
 *   ['es-ES', 'ca-ES'],
 *   { 'es-ES': 'Hola', 'ca-ES': 'Hola' },
 *   [{ id: 1, languages_code: 'es-ES' }]
 * )
 * // Returns: [{ id: 1, languages_code: 'es-ES', name: 'Hola' }, { languages_code: 'ca-ES', name: 'Hola' }]
 */
export function buildTranslationRequests(
  languageCodes: readonly string[],
  newTranslations: Record<string, string>,
  existingTranslations: ExistingTranslation[] = []
): TranslationRequest[] {
  // Map existing translations by language code for O(1) lookup
  const existingIdMap = new Map<string, number>(
    existingTranslations.map((t) => [t.languages_code, t.id])
  );

  return languageCodes.map((code) => {
    const existingId = existingIdMap.get(code);
    const name = newTranslations[code] || '';

    // If translation exists, include ID to update it
    // If it doesn't exist, omit ID to create new one
    if (existingId != null) {
      return { id: existingId, languages_code: code, name };
    }

    return { languages_code: code, name };
  });
}

/**
 * Build translation requests for creating a new entity.
 *
 * Simpler version without existing IDs - all translations are new.
 *
 * @param languageCodes - Language codes to generate translations for
 * @param translations - Translation content keyed by language code
 * @returns Array of translation requests (without IDs)
 */
export function buildNewTranslationRequests(
  languageCodes: readonly string[],
  translations: Record<string, string>
): Omit<TranslationRequest, 'id'>[] {
  return languageCodes.map((code) => ({
    languages_code: code,
    name: translations[code] || '',
  }));
}

/**
 * Extract translation content from Directus entity.
 *
 * Converts Directus translation array to a simple Record for export.
 *
 * @param translations - Array of translations from Directus
 * @param nameField - Field containing the translated text (default: 'name')
 * @returns Record mapping language code to translated text
 *
 * @example
 * extractTranslationContent([
 *   { languages_code: 'es-ES', name: 'Acción' },
 *   { languages_code: 'ca-ES', name: 'Acció' }
 * ])
 * // Returns: { 'es-ES': 'Acción', 'ca-ES': 'Acció' }
 */
export function extractTranslationContent<T extends { languages_code: string }>(
  translations: T[],
  nameField: keyof T = 'name' as keyof T
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const translation of translations) {
    const value = translation[nameField];
    result[translation.languages_code] = typeof value === 'string' ? value : '';
  }

  return result;
}
