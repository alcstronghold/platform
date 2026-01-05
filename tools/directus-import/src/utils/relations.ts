/**
 * Relation resolution utilities for Directus imports/exports.
 *
 * Handles converting between UUIDs and identifiers for the foreign key
 * and many-to-many relationships.
 */

/**
 * Populated relation object from Directus (when using fields expansion)
 */
export interface PopulatedRelation {
  id: string;
  identifier: string;
}

/**
 * Resolve a parent/FK reference to an identifier string.
 *
 * Handles multiple input formats:
 * - null/undefined → null
 * - string (UUID) → lookup in the map → identifier or null
 * - object with identifier → extract identifier directly
 *
 * @param reference - The FK reference (UUID string or populated object)
 * @param idToIdentifierMap - Map of UUID → identifier for resolution
 * @returns The identifier string, or null if not resolvable
 *
 * @example
 * // String UUID reference
 * resolveRelationIdentifier('abc-123', new Map(['abc-123', 'fantasy']))
 * // Returns: 'fantasy'
 *
 * @example
 * // Populated object reference
 * resolveRelationIdentifier({ id: 'abc-123', identifier: 'fantasy' }, new Map())
 * // Returns: 'fantasy'
 *
 * @example
 * // Unknown UUID
 * resolveRelationIdentifier('unknown-id', new Map())
 * // Returns: null
 */
export function resolveRelationIdentifier(
  reference: string | null | undefined | PopulatedRelation,
  idToIdentifierMap: Map<string, string>
): string | null {
  // Handle null/undefined
  if (reference == null) {
    return null;
  }

  // Handle populated relation object
  if (typeof reference === 'object') {
    return reference.identifier ?? null;
  }

  // Handle string UUID - lookup in map
  return idToIdentifierMap.get(reference) ?? null;
}

/**
 * Resolve an array of FK references to identifier strings.
 *
 * Filters out any references that can't be resolved.
 *
 * @param references - Array of FK references
 * @param idToIdentifierMap - Map of UUID → identifier
 * @returns Array of resolved identifiers (unresolved are filtered out)
 */
export function resolveRelationIdentifiers(
  references: Array<string | PopulatedRelation> | null | undefined,
  idToIdentifierMap: Map<string, string>
): string[] {
  if (!references || !Array.isArray(references)) {
    return [];
  }

  const resolved: string[] = [];

  for (const ref of references) {
    const identifier = resolveRelationIdentifier(ref, idToIdentifierMap);
    if (identifier != null) {
      resolved.push(identifier);
    }
  }

  return resolved;
}

/**
 * Build an ID to identifier map from an array of entities.
 *
 * @param entities - Array of entities with id and identifier fields
 * @returns Map of UUID → identifier
 */
export function buildIdToIdentifierMap<T extends { id: string; identifier: string }>(
  entities: T[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const entity of entities) {
    map.set(entity.id, entity.identifier);
  }

  return map;
}

/**
 * Build an identifier to the ID map from an array of entities.
 *
 * Used during imports to resolve identifier references to UUIDs.
 *
 * @param entities - Array of entities with id and identifier fields
 * @returns Map of identifier → UUID
 */
export function buildIdentifierToIdMap<T extends { id: string; identifier: string }>(
  entities: T[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const entity of entities) {
    map.set(entity.identifier, entity.id);
  }

  return map;
}

/**
 * Resolve FK identifiers to UUIDs for import.
 *
 * Given an array of identifier strings and a map, returns the UUIDs.
 * Logs warnings for any identifiers that can't be resolved.
 *
 * @param identifiers - Array of identifier strings to resolve
 * @param identifierToIdMap - Map of identifier → UUID
 * @returns Object with resolved UUIDs and any missing identifiers
 */
export function resolveIdentifiersToIds(
  identifiers: string[] | null | undefined,
  identifierToIdMap: Map<string, string>
): { ids: string[]; missing: string[] } {
  if (!identifiers || !Array.isArray(identifiers)) {
    return { ids: [], missing: [] };
  }

  const ids: string[] = [];
  const missing: string[] = [];

  for (const identifier of identifiers) {
    const id = identifierToIdMap.get(identifier);
    if (id != null) {
      ids.push(id);
    } else {
      missing.push(identifier);
    }
  }

  return { ids, missing };
}
