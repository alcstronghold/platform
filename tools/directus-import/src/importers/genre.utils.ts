/**
 * Pure utility functions for genre import logic.
 *
 * These functions are extracted from GenreImporter to enable unit testing
 * without mocking the Directus client.
 */

import type { GenrePayload } from '@alcstronghold/directus-payload';

/**
 * Result of analyzing a batch of genres for processing order
 */
export interface ProcessableAnalysis {
  /** Genres that can be processed now (no parent or parent already exists) */
  processable: GenrePayload[];
  /** Genres that must wait for their parent to be processed first */
  pending: GenrePayload[];
}

/**
 * Filter genres into processable and pending based on parent dependencies.
 *
 * A genre is processable if:
 * - It has no parent (parent is null), OR
 * - Its parent identifier exists in the existingIdentifiers set
 *
 * @param genres - All genres to analyze
 * @param existingIdentifiers - Set of identifiers that already exist (in DB or processed)
 * @returns Object with processable and pending arrays
 */
export function analyzeProcessableGenres(
  genres: GenrePayload[],
  existingIdentifiers: Set<string>
): ProcessableAnalysis {
  const processable: GenrePayload[] = [];
  const pending: GenrePayload[] = [];

  for (const genre of genres) {
    if (genre.parent == null || existingIdentifiers.has(genre.parent)) {
      processable.push(genre);
    } else {
      pending.push(genre);
    }
  }

  return { processable, pending };
}

/**
 * Simulate the multi-pass import algorithm to determine processing order.
 *
 * Returns the order in which genres would be processed, grouped by pass number.
 * Useful for testing and debugging import order.
 *
 * @param genres - All genres to process
 * @param existingIdentifiers - Identifiers that already exist in DB (optional)
 * @param maxPasses - Maximum number of passes (default: 20)
 * @returns Array of passes, each containing the identifiers processed in that pass
 */
export function simulateMultiPassOrder(
  genres: GenrePayload[],
  existingIdentifiers: Set<string> = new Set(),
  maxPasses: number = 20
): { passes: string[][]; unresolved: string[] } {
  const passes: string[][] = [];
  const processed = new Set(existingIdentifiers);
  let pending = [...genres];

  for (let pass = 0; pass < maxPasses && pending.length > 0; pass++) {
    const { processable, pending: stillPending } = analyzeProcessableGenres(pending, processed);

    if (processable.length === 0) {
      // No progress possible - circular dependency or missing parent
      break;
    }

    // Record this pass
    const passIdentifiers = processable.map((g) => g.identifier);
    passes.push(passIdentifiers);

    // Mark as processed for the next pass
    for (const id of passIdentifiers) {
      processed.add(id);
    }

    pending = stillPending;
  }

  return {
    passes,
    unresolved: pending.map((g) => g.identifier),
  };
}

/**
 * Detect circular dependencies in genre hierarchy.
 *
 * Returns identifiers of genres involved in circular references.
 *
 * @param genres - All genres to check
 * @returns Array of identifiers with circular dependencies
 */
export function detectCircularDependencies(genres: GenrePayload[]): string[] {
  const parentMap = new Map<string, string | null>();
  for (const genre of genres) {
    parentMap.set(genre.identifier, genre.parent);
  }

  const circular: string[] = [];

  for (const genre of genres) {
    const visited = new Set<string>();
    let current: string | null = genre.identifier;

    while (current != null) {
      if (visited.has(current)) {
        // Found a cycle
        circular.push(genre.identifier);
        break;
      }
      visited.add(current);
      current = parentMap.get(current) ?? null;
    }
  }

  return circular;
}

/**
 * Find genres with parents that don't exist in the dataset.
 *
 * @param genres - All genres to check
 * @returns Array of { identifier, missingParent } for genres with missing parents
 */
export function findMissingParents(
  genres: GenrePayload[]
): Array<{ identifier: string; missingParent: string }> {
  const allIdentifiers = new Set(genres.map((g) => g.identifier));
  const missing: Array<{ identifier: string; missingParent: string }> = [];

  for (const genre of genres) {
    if (genre.parent != null && !allIdentifiers.has(genre.parent)) {
      missing.push({
        identifier: genre.identifier,
        missingParent: genre.parent,
      });
    }
  }

  return missing;
}
