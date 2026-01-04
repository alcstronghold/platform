/**
 * Tests para translations.ts - Lógica de traducciones para imports/exports
 *
 * VALOR DE ESTOS TESTS:
 * - Verificar que IDs existentes se preservan (evita duplicados en Directus)
 * - Verificar que nuevas traducciones se crean correctamente
 * - Documentar el comportamiento esperado del sistema de traducciones
 */
import { describe, expect, it } from 'bun:test';

import {
  buildNewTranslationRequests,
  buildTranslationRequests,
  extractTranslationContent,
} from '../translations';

// ============================================================================
// buildTranslationRequests - Construir requests para actualizar traducciones
// ============================================================================

describe('buildTranslationRequests', () => {
  const languageCodes = ['es-ES', 'ca-ES'] as const;

  // -------------------------------------------------------------------------
  // Caso 1: Actualizar traducciones existentes (preservar IDs)
  // -------------------------------------------------------------------------
  describe('actualizar traducciones existentes', () => {
    it('preserva IDs de traducciones existentes', () => {
      const newTranslations = { 'es-ES': 'Acción', 'ca-ES': 'Acció' };
      const existing = [
        { id: 101, languages_code: 'es-ES' },
        { id: 102, languages_code: 'ca-ES' },
      ];

      const result = buildTranslationRequests(languageCodes, newTranslations, existing);

      expect(result).toEqual([
        { id: 101, languages_code: 'es-ES', name: 'Acción' },
        { id: 102, languages_code: 'ca-ES', name: 'Acció' },
      ]);
    });

    it('mantiene el orden de languageCodes', () => {
      const codes = ['ca-ES', 'es-ES'] as const; // Orden invertido
      const newTranslations = { 'es-ES': 'Spanish', 'ca-ES': 'Catalan' };
      const existing = [
        { id: 1, languages_code: 'es-ES' },
        { id: 2, languages_code: 'ca-ES' },
      ];

      const result = buildTranslationRequests(codes, newTranslations, existing);

      expect(result[0].languages_code).toBe('ca-ES');
      expect(result[1].languages_code).toBe('es-ES');
    });
  });

  // -------------------------------------------------------------------------
  // Caso 2: Crear nuevas traducciones (sin IDs existentes)
  // -------------------------------------------------------------------------
  describe('crear nuevas traducciones', () => {
    it('omite ID cuando no hay traducción existente', () => {
      const newTranslations = { 'es-ES': 'Nuevo', 'ca-ES': 'Nou' };
      const existing: { id: number; languages_code: string }[] = [];

      const result = buildTranslationRequests(languageCodes, newTranslations, existing);

      expect(result).toEqual([
        { languages_code: 'es-ES', name: 'Nuevo' },
        { languages_code: 'ca-ES', name: 'Nou' },
      ]);
      // Verificar que no tiene propiedad 'id'
      expect(result[0]).not.toHaveProperty('id');
      expect(result[1]).not.toHaveProperty('id');
    });

    it('usa string vacío si falta traducción para un idioma', () => {
      const newTranslations = { 'es-ES': 'Solo español' }; // Falta ca-ES

      const result = buildTranslationRequests(languageCodes, newTranslations, []);

      expect(result).toEqual([
        { languages_code: 'es-ES', name: 'Solo español' },
        { languages_code: 'ca-ES', name: '' },
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // Caso 3: Mezcla de existentes y nuevas
  // -------------------------------------------------------------------------
  describe('mezcla de existentes y nuevas', () => {
    it('preserva ID existente y crea nueva sin ID', () => {
      const newTranslations = { 'es-ES': 'Español', 'ca-ES': 'Català' };
      const existing = [{ id: 99, languages_code: 'es-ES' }]; // Solo español existe

      const result = buildTranslationRequests(languageCodes, newTranslations, existing);

      expect(result).toEqual([
        { id: 99, languages_code: 'es-ES', name: 'Español' },
        { languages_code: 'ca-ES', name: 'Català' },
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // Caso 4: Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('maneja existingTranslations undefined', () => {
      const newTranslations = { 'es-ES': 'Test' };

      const result = buildTranslationRequests(languageCodes, newTranslations);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('id');
    });

    it('maneja traducciones existentes con idiomas extra (ignorados)', () => {
      const newTranslations = { 'es-ES': 'Spanish' };
      const existing = [
        { id: 1, languages_code: 'es-ES' },
        { id: 2, languages_code: 'fr-FR' }, // No está en languageCodes
      ];

      const result = buildTranslationRequests(languageCodes, newTranslations, existing);

      // Solo incluye los idiomas configurados
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.languages_code)).toEqual(['es-ES', 'ca-ES']);
    });

    it('maneja array vacío de languageCodes', () => {
      const result = buildTranslationRequests([], { 'es-ES': 'Test' }, []);
      expect(result).toEqual([]);
    });
  });
});

// ============================================================================
// buildNewTranslationRequests - Construir requests para nuevas entidades
// ============================================================================

describe('buildNewTranslationRequests', () => {
  const languageCodes = ['es-ES', 'ca-ES'] as const;

  it('crea traducciones sin IDs', () => {
    const translations = { 'es-ES': 'Español', 'ca-ES': 'Català' };

    const result = buildNewTranslationRequests(languageCodes, translations);

    expect(result).toEqual([
      { languages_code: 'es-ES', name: 'Español' },
      { languages_code: 'ca-ES', name: 'Català' },
    ]);
  });

  it('usa string vacío para traducciones faltantes', () => {
    const translations = { 'es-ES': 'Solo español' };

    const result = buildNewTranslationRequests(languageCodes, translations);

    expect(result[1].name).toBe('');
  });

  it('maneja objeto de traducciones vacío', () => {
    const result = buildNewTranslationRequests(languageCodes, {});

    expect(result).toEqual([
      { languages_code: 'es-ES', name: '' },
      { languages_code: 'ca-ES', name: '' },
    ]);
  });
});

// ============================================================================
// extractTranslationContent - Extraer contenido para exportación
// ============================================================================

describe('extractTranslationContent', () => {
  it('extrae traducciones a Record', () => {
    const translations = [
      { languages_code: 'es-ES', name: 'Acción', id: 1 },
      { languages_code: 'ca-ES', name: 'Acció', id: 2 },
    ];

    const result = extractTranslationContent(translations);

    expect(result).toEqual({
      'es-ES': 'Acción',
      'ca-ES': 'Acció',
    });
  });

  it('usa campo personalizado', () => {
    const translations = [
      { languages_code: 'es-ES', description: 'Descripción ES', name: 'ignored' },
      { languages_code: 'ca-ES', description: 'Descripció CA', name: 'ignored' },
    ];

    const result = extractTranslationContent(translations, 'description');

    expect(result).toEqual({
      'es-ES': 'Descripción ES',
      'ca-ES': 'Descripció CA',
    });
  });

  it('maneja array vacío', () => {
    const result = extractTranslationContent([]);
    expect(result).toEqual({});
  });

  it('maneja valores no-string como vacío', () => {
    const translations = [
      { languages_code: 'es-ES', name: null as unknown as string },
      { languages_code: 'ca-ES', name: undefined as unknown as string },
    ];

    const result = extractTranslationContent(translations);

    expect(result).toEqual({
      'es-ES': '',
      'ca-ES': '',
    });
  });

  it('sobrescribe si hay idiomas duplicados (último gana)', () => {
    const translations = [
      { languages_code: 'es-ES', name: 'Primero' },
      { languages_code: 'es-ES', name: 'Segundo' }, // Duplicado
    ];

    const result = extractTranslationContent(translations);

    expect(result['es-ES']).toBe('Segundo');
  });
});
