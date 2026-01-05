/**
 * Tests para normalize.ts - Funciones de normalización de datos
 *
 * VALOR DE ESTOS TESTS:
 * - Verificar que datos de JSON (strings, numbers, null) se normalizan correctamente
 * - Prevenir datos corruptos en la base de datos
 * - Documentar edge cases (NaN, Infinity, strings vacíos, etc.)
 */
import { describe, expect, it } from 'bun:test';

import { normalizeBggId, normalizeString, normalizeUrl } from '../normalize';

// ============================================================================
// normalizeBggId - Normalizar BoardGameGeek IDs
// ============================================================================

describe('normalizeBggId', () => {
  // -------------------------------------------------------------------------
  // Caso 1: Números válidos
  // -------------------------------------------------------------------------
  describe('números válidos', () => {
    it('devuelve number tal cual', () => {
      expect(normalizeBggId(12345)).toBe(12345);
    });

    it('maneja cero', () => {
      expect(normalizeBggId(0)).toBe(0);
    });

    it('maneja números negativos', () => {
      // BGG ID's no deberían ser negativos, pero la función no verifica eso
      expect(normalizeBggId(-1)).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // Caso 2: Strings válidos (parseables a número)
  // -------------------------------------------------------------------------
  describe('strings válidos', () => {
    it('parsea string numérico', () => {
      expect(normalizeBggId('12345')).toBe(12345);
    });

    it('parsea string con espacios', () => {
      expect(normalizeBggId('  12345  ')).toBe(12345);
    });

    it('parsea string con cero', () => {
      expect(normalizeBggId('0')).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Caso 3: Valores nulos/undefined
  // -------------------------------------------------------------------------
  describe('valores nulos', () => {
    it('devuelve null para null', () => {
      expect(normalizeBggId(null)).toBeNull();
    });

    it('devuelve null para undefined', () => {
      expect(normalizeBggId(undefined)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Caso 4: Strings inválidos (no parseables)
  // -------------------------------------------------------------------------
  describe('strings inválidos', () => {
    it('devuelve null para string no numérico', () => {
      expect(normalizeBggId('abc')).toBeNull();
    });

    it('devuelve null para string vacío', () => {
      expect(normalizeBggId('')).toBeNull();
    });

    it('devuelve null para string solo espacios', () => {
      expect(normalizeBggId('   ')).toBeNull();
    });

    it('parsea parcialmente strings mixtos (comportamiento de parseInt)', () => {
      // parseInt('123abc') = 123 - esto es comportamiento de JS
      expect(normalizeBggId('123abc')).toBe(123);
    });

    it('devuelve null si empieza con letra', () => {
      expect(normalizeBggId('abc123')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Caso 5: Edge cases numéricos
  // -------------------------------------------------------------------------
  describe('edge cases numéricos', () => {
    it('devuelve null para NaN', () => {
      expect(normalizeBggId(NaN)).toBeNull();
    });

    it('devuelve null para Infinity', () => {
      expect(normalizeBggId(Infinity)).toBeNull();
    });

    it('devuelve null para -Infinity', () => {
      expect(normalizeBggId(-Infinity)).toBeNull();
    });

    it('maneja números muy grandes', () => {
      expect(normalizeBggId(999999999)).toBe(999999999);
    });

    it('maneja decimales (trunca a entero)', () => {
      // parseInt trunca, así que si recibimos string "12.5" → 12
      expect(normalizeBggId('12.5')).toBe(12);
    });
  });
});

// ============================================================================
// normalizeString - Normalizar strings
// ============================================================================

describe('normalizeString', () => {
  it('devuelve string trimmed', () => {
    expect(normalizeString('  hello  ')).toBe('hello');
  });

  it('devuelve null para string vacío', () => {
    expect(normalizeString('')).toBeNull();
  });

  it('devuelve null para string solo espacios', () => {
    expect(normalizeString('   ')).toBeNull();
  });

  it('devuelve null para null', () => {
    expect(normalizeString(null)).toBeNull();
  });

  it('devuelve null para undefined', () => {
    expect(normalizeString(undefined)).toBeNull();
  });

  it('preserva string válido sin espacios extra', () => {
    expect(normalizeString('hello world')).toBe('hello world');
  });
});

// ============================================================================
// normalizeUrl - Normalizar URLs
// ============================================================================

describe('normalizeUrl', () => {
  describe('URLs válidas', () => {
    it('preserva URL con https', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('preserva URL con http', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('añade https a URL sin protocolo', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    it('añade https a URL con www', () => {
      expect(normalizeUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('preserva path y query', () => {
      expect(normalizeUrl('https://example.com/path?q=1')).toBe(
        'https://example.com/path?q=1'
      );
    });

    it('trims espacios', () => {
      expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
    });
  });

  describe('URLs inválidas', () => {
    it('devuelve null para string vacío', () => {
      expect(normalizeUrl('')).toBeNull();
    });

    it('devuelve null para null', () => {
      expect(normalizeUrl(null)).toBeNull();
    });

    it('devuelve null para undefined', () => {
      expect(normalizeUrl(undefined)).toBeNull();
    });

    it('devuelve null para solo espacios', () => {
      expect(normalizeUrl('   ')).toBeNull();
    });
  });
});
