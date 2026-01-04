/**
 * Tests para genre.utils.ts - Lógica multi-pass de importación
 *
 * VALOR DE ESTOS TESTS:
 * - Verificar que el orden de procesamiento respeta dependencias padre-hijo
 * - Detectar ciclos que causarían bucles infinitos
 * - Encontrar padres faltantes que causarían imports incompletos
 * - Documentar el algoritmo de multi-pass para futuros desarrolladores
 */
import type { GenrePayload } from '@alcstronghold/directus-payload';
import { describe, expect, it } from 'bun:test';

import {
  analyzeProcessableGenres,
  detectCircularDependencies,
  findMissingParents,
  simulateMultiPassOrder,
} from '../genre.utils';

// ============================================================================
// Helper para crear payloads de test
// ============================================================================

function createGenre(identifier: string, parent: string | null = null): GenrePayload {
  return {
    identifier,
    name: identifier,
    parent,
    translations: { 'es-ES': identifier, 'ca-ES': identifier },
  };
}

// ============================================================================
// analyzeProcessableGenres - Filtrar géneros por dependencias
// ============================================================================

describe('analyzeProcessableGenres', () => {
  describe('géneros sin padre', () => {
    it('todos los géneros sin padre son procesables', () => {
      const genres = [
        createGenre('action'),
        createGenre('adventure'),
        createGenre('rpg'),
      ];

      const result = analyzeProcessableGenres(genres, new Set());

      expect(result.processable).toHaveLength(3);
      expect(result.pending).toHaveLength(0);
    });
  });

  describe('géneros con padre existente', () => {
    it('género con padre en existingIdentifiers es procesable', () => {
      const genres = [createGenre('action-fps', 'action')];
      const existing = new Set(['action']);

      const result = analyzeProcessableGenres(genres, existing);

      expect(result.processable).toHaveLength(1);
      expect(result.pending).toHaveLength(0);
    });

    it('género con padre NO existente queda pendiente', () => {
      const genres = [createGenre('action-fps', 'action')];
      const existing = new Set<string>(); // Vacío

      const result = analyzeProcessableGenres(genres, existing);

      expect(result.processable).toHaveLength(0);
      expect(result.pending).toHaveLength(1);
    });
  });

  describe('mezcla de géneros', () => {
    it('separa correctamente procesables y pendientes', () => {
      const genres = [
        createGenre('rpg'),              // Sin padre → procesable
        createGenre('crpg', 'rpg'),      // Padre no existe → pendiente
        createGenre('action'),           // Sin padre → procesable
        createGenre('fps', 'action'),    // Padre no existe → pendiente
        createGenre('jrpg', 'rpg'),      // Padre no existe → pendiente
      ];
      const existing = new Set<string>();

      const result = analyzeProcessableGenres(genres, existing);

      expect(result.processable.map((g) => g.identifier)).toEqual(['rpg', 'action']);
      expect(result.pending.map((g) => g.identifier)).toEqual(['crpg', 'fps', 'jrpg']);
    });
  });
});

// ============================================================================
// simulateMultiPassOrder - Simular el algoritmo completo
// ============================================================================

describe('simulateMultiPassOrder', () => {
  describe('géneros planos (sin jerarquía)', () => {
    it('procesa todos en un solo pass', () => {
      const genres = [
        createGenre('action'),
        createGenre('adventure'),
        createGenre('rpg'),
      ];

      const result = simulateMultiPassOrder(genres);

      expect(result.passes).toHaveLength(1);
      expect(result.passes[0]).toEqual(['action', 'adventure', 'rpg']);
      expect(result.unresolved).toHaveLength(0);
    });
  });

  describe('jerarquía de 2 niveles', () => {
    it('procesa padres primero, hijos después', () => {
      const genres = [
        createGenre('fps', 'action'),    // Hijo - debe esperar
        createGenre('action'),           // Padre - primero
        createGenre('rpg'),              // Sin padre - primero
        createGenre('jrpg', 'rpg'),      // Hijo - debe esperar
      ];

      const result = simulateMultiPassOrder(genres);

      expect(result.passes).toHaveLength(2);
      expect(result.passes[0]).toEqual(['action', 'rpg']);  // Padres primero
      expect(result.passes[1]).toEqual(['fps', 'jrpg']);    // Hijos después
      expect(result.unresolved).toHaveLength(0);
    });
  });

  describe('jerarquía de 3+ niveles', () => {
    it('procesa nivel por nivel', () => {
      // Árbol: action → fps → tactical-fps
      const genres = [
        createGenre('tactical-fps', 'fps'),  // Nivel 3
        createGenre('fps', 'action'),        // Nivel 2
        createGenre('action'),               // Nivel 1 (raíz)
      ];

      const result = simulateMultiPassOrder(genres);

      expect(result.passes).toHaveLength(3);
      expect(result.passes[0]).toEqual(['action']);
      expect(result.passes[1]).toEqual(['fps']);
      expect(result.passes[2]).toEqual(['tactical-fps']);
    });

    it('procesa árboles paralelos correctamente', () => {
      // Dos árboles independientes:
      // action → fps → tactical-fps
      // rpg → jrpg → tactical-jrpg
      const genres = [
        createGenre('action'),
        createGenre('rpg'),
        createGenre('fps', 'action'),
        createGenre('jrpg', 'rpg'),
        createGenre('tactical-fps', 'fps'),
        createGenre('tactical-jrpg', 'jrpg'),
      ];

      const result = simulateMultiPassOrder(genres);

      expect(result.passes).toHaveLength(3);
      // Pass 1: raíces
      expect(result.passes[0].sort()).toEqual(['action', 'rpg']);
      // Pass 2: nivel 2
      expect(result.passes[1].sort()).toEqual(['fps', 'jrpg']);
      // Pass 3: nivel 3
      expect(result.passes[2].sort()).toEqual(['tactical-fps', 'tactical-jrpg']);
    });
  });

  describe('con géneros pre-existentes', () => {
    it('considera existingIdentifiers como ya procesados', () => {
      const genres = [
        createGenre('fps', 'action'),  // Padre ya existe
        createGenre('jrpg', 'rpg'),    // Padre ya existe
      ];
      const existing = new Set(['action', 'rpg']);

      const result = simulateMultiPassOrder(genres, existing);

      expect(result.passes).toHaveLength(1);
      expect(result.passes[0].sort()).toEqual(['fps', 'jrpg']);
    });
  });

  describe('dependencias irresolubles', () => {
    it('detecta padre faltante y lo reporta como unresolved', () => {
      const genres = [
        createGenre('action'),
        createGenre('mystery-subgenre', 'nonexistent'),  // Padre no existe
      ];

      const result = simulateMultiPassOrder(genres);

      expect(result.passes).toHaveLength(1);
      expect(result.passes[0]).toEqual(['action']);
      expect(result.unresolved).toEqual(['mystery-subgenre']);
    });
  });

  describe('límite de passes', () => {
    it('respeta maxPasses para evitar bucles infinitos', () => {
      // Cadena muy larga
      const genres = Array.from({ length: 25 }, (_, i) =>
        createGenre(`level-${i}`, i > 0 ? `level-${i - 1}` : null)
      );

      const result = simulateMultiPassOrder(genres, new Set(), 10);

      // Solo procesa 10 niveles por el límite
      expect(result.passes).toHaveLength(10);
      expect(result.unresolved).toHaveLength(15); // Los 15 restantes
    });
  });
});

// ============================================================================
// detectCircularDependencies - Encontrar ciclos
// ============================================================================

describe('detectCircularDependencies', () => {
  it('devuelve vacío cuando no hay ciclos', () => {
    const genres = [
      createGenre('action'),
      createGenre('fps', 'action'),
      createGenre('rpg'),
    ];

    expect(detectCircularDependencies(genres)).toEqual([]);
  });

  it('detecta ciclo simple A → B → A', () => {
    const genres = [
      createGenre('a', 'b'),
      createGenre('b', 'a'),
    ];

    const circular = detectCircularDependencies(genres);

    expect(circular).toContain('a');
    expect(circular).toContain('b');
  });

  it('detecta ciclo largo A → B → C → A', () => {
    const genres = [
      createGenre('a', 'b'),
      createGenre('b', 'c'),
      createGenre('c', 'a'),
    ];

    const circular = detectCircularDependencies(genres);

    expect(circular).toHaveLength(3);
    expect(circular).toContain('a');
    expect(circular).toContain('b');
    expect(circular).toContain('c');
  });

  it('detecta auto-referencia A → A', () => {
    const genres = [createGenre('a', 'a')];

    expect(detectCircularDependencies(genres)).toEqual(['a']);
  });

  it('no marca como circular a géneros válidos junto a ciclos', () => {
    const genres = [
      createGenre('valid-root'),
      createGenre('valid-child', 'valid-root'),
      createGenre('cycle-a', 'cycle-b'),
      createGenre('cycle-b', 'cycle-a'),
    ];

    const circular = detectCircularDependencies(genres);

    expect(circular).not.toContain('valid-root');
    expect(circular).not.toContain('valid-child');
    expect(circular).toContain('cycle-a');
    expect(circular).toContain('cycle-b');
  });
});

// ============================================================================
// findMissingParents - Encontrar padres que no existen
// ============================================================================

describe('findMissingParents', () => {
  it('devuelve vacío cuando todos los padres existen', () => {
    const genres = [
      createGenre('action'),
      createGenre('fps', 'action'),
    ];

    expect(findMissingParents(genres)).toEqual([]);
  });

  it('encuentra padre faltante', () => {
    const genres = [
      createGenre('action'),
      createGenre('mystery', 'nonexistent'),
    ];

    const missing = findMissingParents(genres);

    expect(missing).toHaveLength(1);
    expect(missing[0]).toEqual({
      identifier: 'mystery',
      missingParent: 'nonexistent',
    });
  });

  it('encuentra múltiples padres faltantes', () => {
    const genres = [
      createGenre('child1', 'missing1'),
      createGenre('child2', 'missing2'),
      createGenre('valid-root'),
    ];

    const missing = findMissingParents(genres);

    expect(missing).toHaveLength(2);
    expect(missing.map((m) => m.missingParent).sort()).toEqual(['missing1', 'missing2']);
  });

  it('ignora géneros sin padre', () => {
    const genres = [
      createGenre('root1'),
      createGenre('root2'),
    ];

    expect(findMissingParents(genres)).toEqual([]);
  });
});
