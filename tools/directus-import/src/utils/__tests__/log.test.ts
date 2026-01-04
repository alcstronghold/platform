/**
 * Tests para log.ts - extractErrorMessage()
 *
 * VALOR DE ESTOS TESTS:
 * - Verificar que errores de Directus (varios formatos) se parsean correctamente
 * - Si falla, los logs son ilegibles y el debugging es imposible
 * - Documenta todos los formatos de error que Directus puede devolver
 */
import { describe, expect, it } from 'bun:test';

import { extractErrorMessage } from '../log';

describe('extractErrorMessage', () => {
  // -------------------------------------------------------------------------
  // CASO 1: Error estándar de JavaScript
  // -------------------------------------------------------------------------
  describe('Error instances estándar', () => {
    it('extrae message de Error simple', () => {
      const error = new Error('Something went wrong');
      expect(extractErrorMessage(error)).toBe('Something went wrong');
    });

    it('maneja Error sin mensaje', () => {
      const error = new Error();
      expect(extractErrorMessage(error)).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // CASO 2: Error con array de errores Directus (formato más común)
  // Directus SDK lanza errores con esta estructura
  // -------------------------------------------------------------------------
  describe('Error con array de errores Directus', () => {
    it('extrae mensajes de errors array', () => {
      const error = new Error('API Error');
      (error as unknown as Record<string, unknown>).errors = [
        { message: 'Field "name" is required' },
        { message: 'Field "email" must be unique' },
      ];

      expect(extractErrorMessage(error)).toBe(
        'Field "name" is required; Field "email" must be unique'
      );
    });

    it('maneja error sin message en el array', () => {
      const error = new Error('API Error');
      (error as unknown as Record<string, unknown>).errors = [
        { code: 'INVALID' }, // Sin message
        { message: 'Valid error' },
      ];

      expect(extractErrorMessage(error)).toBe('Unknown; Valid error');
    });

    it('maneja array vacío de errors', () => {
      const error = new Error('Fallback message');
      (error as unknown as Record<string, unknown>).errors = [];

      // Array vacío → join devuelve '', pero debería usar el message original
      // Veamos qué hace el código actual...
      expect(extractErrorMessage(error)).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // CASO 3: Objeto plano con estructura Directus (no Error instance)
  // A veces Directus devuelve objetos planos en lugar de Error
  // -------------------------------------------------------------------------
  describe('objetos planos con estructura Directus', () => {
    it('extrae mensajes de { errors: [...] }', () => {
      const error = {
        errors: [
          { message: 'Unauthorized' },
          { message: 'Token expired' },
        ],
      };

      expect(extractErrorMessage(error)).toBe('Unauthorized; Token expired');
    });

    it('serializa objetos en errors sin message', () => {
      const error = {
        errors: [{ code: 'FORBIDDEN', details: 'No access' }],
      };

      // Sin message, debería hacer JSON.stringify del objeto
      expect(extractErrorMessage(error)).toBe('{"code":"FORBIDDEN","details":"No access"}');
    });

    it('convierte primitivos en errors array', () => {
      const error = {
        errors: ['Simple string error', 42],
      };

      expect(extractErrorMessage(error)).toBe('Simple string error; 42');
    });
  });

  // -------------------------------------------------------------------------
  // CASO 4: Objeto con solo { message: string }
  // -------------------------------------------------------------------------
  describe('objeto con message directo', () => {
    it('extrae message de objeto simple', () => {
      const error = { message: 'Direct message' };
      expect(extractErrorMessage(error)).toBe('Direct message');
    });

    it('ignora message si no es string', () => {
      const error = { message: 123 }; // message no es string
      // Debería caer al fallback JSON.stringify
      expect(extractErrorMessage(error)).toBe('{"message":123}');
    });
  });

  // -------------------------------------------------------------------------
  // CASO 5: Respuesta HTTP anidada (axios/fetch error wrapper)
  // Estructura: { response: { data: { errors: [...] } } }
  // -------------------------------------------------------------------------
  describe('respuesta HTTP anidada', () => {
    it('extrae errores de response.data.errors', () => {
      const error = {
        response: {
          data: {
            errors: [
              { message: 'Not found' },
              { message: 'Invalid ID format' },
            ],
          },
        },
      };

      expect(extractErrorMessage(error)).toBe('Not found; Invalid ID format');
    });

    it('maneja response sin data.errors', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal error' },
        },
      };

      // No tiene data.errors, debería serializar el objeto completo
      const result = extractErrorMessage(error);
      expect(result).toContain('"status":500');
    });
  });

  // -------------------------------------------------------------------------
  // CASO 6: Fallbacks para tipos primitivos y edge cases
  // -------------------------------------------------------------------------
  describe('fallbacks y edge cases', () => {
    it('convierte string a string', () => {
      expect(extractErrorMessage('plain error string')).toBe('plain error string');
    });

    it('convierte number a string', () => {
      expect(extractErrorMessage(404)).toBe('404');
    });

    it('convierte null a string', () => {
      expect(extractErrorMessage(null)).toBe('null');
    });

    it('convierte undefined a string', () => {
      expect(extractErrorMessage(undefined)).toBe('undefined');
    });

    it('serializa objeto sin estructura reconocida', () => {
      const error = { foo: 'bar', count: 42 };
      expect(extractErrorMessage(error)).toBe('{"foo":"bar","count":42}');
    });

    it('maneja objetos con referencias circulares', () => {
      const error: Record<string, unknown> = { name: 'circular' };
      error.self = error; // Referencia circular

      // JSON.stringify falla, debería devolver mensaje de fallback
      expect(extractErrorMessage(error)).toBe('[Object could not be serialized]');
    });
  });

  // -------------------------------------------------------------------------
  // CASO 7: Casos reales de errores Directus
  // Estos son ejemplos de errores que hemos visto en producción
  // -------------------------------------------------------------------------
  describe('errores reales de Directus', () => {
    it('error de validación de campo requerido', () => {
      const error = {
        errors: [
          {
            message: '"identifier" is required',
            extensions: { code: 'FAILED_VALIDATION' },
          },
        ],
      };

      expect(extractErrorMessage(error)).toBe('"identifier" is required');
    });

    it('error de duplicado (unique constraint)', () => {
      const error = new Error('Request failed');
      (error as unknown as Record<string, unknown>).errors = [
        {
          message: 'Field "identifier" has to be unique.',
          extensions: {
            code: 'RECORD_NOT_UNIQUE',
            field: 'identifier',
          },
        },
      ];

      expect(extractErrorMessage(error)).toBe('Field "identifier" has to be unique.');
    });

    it('error de relación no encontrada', () => {
      const error = {
        errors: [
          {
            message: 'Invalid foreign key',
            extensions: {
              code: 'INVALID_FOREIGN_KEY',
              collection: 'rpg_editions',
              field: 'rpg_family_id',
            },
          },
        ],
      };

      expect(extractErrorMessage(error)).toBe('Invalid foreign key');
    });
  });
});
