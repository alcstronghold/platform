/**
 * Data normalization utilities.
 *
 * Pure functions for transforming and validating data before import.
 */

/**
 * Normalize a BoardGameGeek ID to a number or null.
 *
 * Handles various input types that may come from JSON files or user input:
 * - number: returned as-is
 * - string: parsed to integer, null if invalid
 * - null/undefined: returned as null
 *
 * @param bggId - The BGG ID in various formats
 * @returns The normalized BGG ID as number, or null if invalid/missing
 *
 * @example
 * normalizeBggId(12345)      // → 12345
 * normalizeBggId("12345")    // → 12345
 * normalizeBggId("abc")      // → null (invalid)
 * normalizeBggId(null)       // → null
 * normalizeBggId(undefined)  // → null
 */
export function normalizeBggId(bggId: number | string | undefined | null): number | null {
  // Handle null/undefined
  if (bggId == null) {
    return null;
  }

  // Already a number
  if (typeof bggId === 'number') {
    // Handle edge cases: NaN, Infinity
    if (!Number.isFinite(bggId)) {
      return null;
    }
    return bggId;
  }

  // Parse string
  const trimmed = String(bggId).trim();
  if (trimmed === '') {
    return null;
  }

  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Normalize a string value, trimming whitespace and converting empty to null.
 *
 * @param value - The string value to normalize
 * @returns Trimmed string or null if empty/whitespace-only
 */
export function normalizeString(value: string | undefined | null): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Normalize a URL, ensuring it has a protocol and is valid.
 *
 * @param url - The URL to normalize
 * @returns Valid URL string or null if invalid
 */
export function normalizeUrl(url: string | undefined | null): string | null {
  if (url == null) {
    return null;
  }

  const trimmed = url.trim();
  if (trimmed === '') {
    return null;
  }

  // Add https:// if no protocol
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    new URL(withProtocol);
    return withProtocol;
  } catch {
    return null;
  }
}
