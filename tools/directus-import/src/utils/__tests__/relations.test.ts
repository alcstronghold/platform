/**
 * Tests para relations.ts - Resolución de claves foráneas y relaciones de muchos a muchos

UTILIDAD DE ESTOS TESTS:
- Comprobar que los UUID se traducen adecuadamente a identificadores (exportación)
- Comprobar que los identificadores se traducen a UUID (importación)
- Gestionar escenarios de Directus con relaciones completas o incompletas
- Identificar relaciones erróneas (identificadores inexistentes)
 */
import { describe, expect, it } from 'bun:test';

import {
  buildIdentifierToIdMap,
  buildIdToIdentifierMap,
  resolveIdentifiersToIds,
  resolveRelationIdentifier,
  resolveRelationIdentifiers,
} from '../relations';

// ============================================================================
// resolveRelationIdentifier - Resolver una FK a identifier
// ============================================================================

describe('resolveRelationIdentifier', () => {
  const idMap = new Map([
    ['uuid-1', 'fantasy'],
    ['uuid-2', 'sci-fi'],
    ['uuid-3', 'horror'],
  ]);

  // -------------------------------------------------------------------------
  // Caso 1: Referencia null/undefined
  // -------------------------------------------------------------------------
  describe('referencias nulas', () => {
    it('devuelve null para null', () => {
      expect(resolveRelationIdentifier(null, idMap)).toBeNull();
    });

    it('devuelve null para undefined', () => {
      expect(resolveRelationIdentifier(undefined, idMap)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Caso 2: String UUID
  // -------------------------------------------------------------------------
  describe('string UUID', () => {
    it('resuelve UUID existente a identifier', () => {
      expect(resolveRelationIdentifier('uuid-1', idMap)).toBe('fantasy');
    });

    it('devuelve null para UUID no existente', () => {
      expect(resolveRelationIdentifier('uuid-unknown', idMap)).toBeNull();
    });

    it('devuelve null para string vacío', () => {
      expect(resolveRelationIdentifier('', idMap)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Caso 3: Objeto expandido (Directus expande la relación)
  // -------------------------------------------------------------------------
  describe('objeto expandido', () => {
    it('extrae identifier del objeto', () => {
      const populated = { id: 'uuid-1', identifier: 'fantasy' };
      expect(resolveRelationIdentifier(populated, idMap)).toBe('fantasy');
    });

    it('funciona sin consultar el map (usa identifier directo)', () => {
      const populated = { id: 'uuid-unknown', identifier: 'custom' };
      expect(resolveRelationIdentifier(populated, new Map())).toBe('custom');
    });

    it('devuelve null si objeto no tiene identifier', () => {
      const broken = { id: 'uuid-1' } as { id: string; identifier: string };
      expect(resolveRelationIdentifier(broken, idMap)).toBeNull();
    });
  });
});

// ============================================================================
// resolveRelationIdentifiers - Resolver array de FKs
// ============================================================================

describe('resolveRelationIdentifiers', () => {
  const idMap = new Map([
    ['uuid-1', 'fantasy'],
    ['uuid-2', 'sci-fi'],
  ]);

  it('resuelve array de UUIDs', () => {
    const refs = ['uuid-1', 'uuid-2'];
    expect(resolveRelationIdentifiers(refs, idMap)).toEqual(['fantasy', 'sci-fi']);
  });

  it('filtra UUIDs no encontrados', () => {
    const refs = ['uuid-1', 'uuid-unknown', 'uuid-2'];
    expect(resolveRelationIdentifiers(refs, idMap)).toEqual(['fantasy', 'sci-fi']);
  });

  it('maneja mezcla de strings y objetos', () => {
    const refs = [
      'uuid-1',
      { id: 'uuid-3', identifier: 'horror' },
    ];
    expect(resolveRelationIdentifiers(refs, idMap)).toEqual(['fantasy', 'horror']);
  });

  it('devuelve vacío para null', () => {
    expect(resolveRelationIdentifiers(null, idMap)).toEqual([]);
  });

  it('devuelve vacío para undefined', () => {
    expect(resolveRelationIdentifiers(undefined, idMap)).toEqual([]);
  });

  it('devuelve vacío para array vacío', () => {
    expect(resolveRelationIdentifiers([], idMap)).toEqual([]);
  });
});

// ============================================================================
// buildIdToIdentifierMap - Crear mapa id → identifier
// ============================================================================

describe('buildIdToIdentifierMap', () => {
  it('construye mapa desde entidades', () => {
    const entities = [
      { id: 'uuid-1', identifier: 'fantasy', name: 'Fantasy' },
      { id: 'uuid-2', identifier: 'sci-fi', name: 'Sci-Fi' },
    ];

    const map = buildIdToIdentifierMap(entities);

    expect(map.get('uuid-1')).toBe('fantasy');
    expect(map.get('uuid-2')).toBe('sci-fi');
    expect(map.size).toBe(2);
  });

  it('maneja array vacío', () => {
    expect(buildIdToIdentifierMap([]).size).toBe(0);
  });

  it('último gana en caso de IDs duplicados', () => {
    const entities = [
      { id: 'uuid-1', identifier: 'first' },
      { id: 'uuid-1', identifier: 'second' }, // Duplicado
    ];

    const map = buildIdToIdentifierMap(entities);

    expect(map.get('uuid-1')).toBe('second');
  });
});

// ============================================================================
// buildIdentifierToIdMap - Crear mapa identifier → id
// ============================================================================

describe('buildIdentifierToIdMap', () => {
  it('construye mapa desde entidades', () => {
    const entities = [
      { id: 'uuid-1', identifier: 'fantasy' },
      { id: 'uuid-2', identifier: 'sci-fi' },
    ];

    const map = buildIdentifierToIdMap(entities);

    expect(map.get('fantasy')).toBe('uuid-1');
    expect(map.get('sci-fi')).toBe('uuid-2');
  });

  it('último gana en caso de identifiers duplicados', () => {
    const entities = [
      { id: 'uuid-1', identifier: 'genre' },
      { id: 'uuid-2', identifier: 'genre' }, // Duplicado
    ];

    const map = buildIdentifierToIdMap(entities);

    expect(map.get('genre')).toBe('uuid-2');
  });
});

// ============================================================================
// resolveIdentifiersToIds - Resolver identifiers a UUIDs (import)
// ============================================================================

describe('resolveIdentifiersToIds', () => {
  const identifierMap = new Map([
    ['fantasy', 'uuid-1'],
    ['sci-fi', 'uuid-2'],
  ]);

  it('resuelve identifiers a UUIDs', () => {
    const result = resolveIdentifiersToIds(['fantasy', 'sci-fi'], identifierMap);

    expect(result.ids).toEqual(['uuid-1', 'uuid-2']);
    expect(result.missing).toEqual([]);
  });

  it('reporta identifiers faltantes', () => {
    const result = resolveIdentifiersToIds(['fantasy', 'horror', 'sci-fi'], identifierMap);

    expect(result.ids).toEqual(['uuid-1', 'uuid-2']);
    expect(result.missing).toEqual(['horror']);
  });

  it('mantiene orden de IDs resueltos', () => {
    const result = resolveIdentifiersToIds(['sci-fi', 'fantasy'], identifierMap);

    expect(result.ids).toEqual(['uuid-2', 'uuid-1']);
  });

  it('maneja null', () => {
    const result = resolveIdentifiersToIds(null, identifierMap);

    expect(result.ids).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it('maneja undefined', () => {
    const result = resolveIdentifiersToIds(undefined, identifierMap);

    expect(result.ids).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it('maneja array vacío', () => {
    const result = resolveIdentifiersToIds([], identifierMap);

    expect(result.ids).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it('reporta todos como faltantes si mapa está vacío', () => {
    const result = resolveIdentifiersToIds(['a', 'b'], new Map());

    expect(result.ids).toEqual([]);
    expect(result.missing).toEqual(['a', 'b']);
  });
});
