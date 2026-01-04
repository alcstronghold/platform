/**
 * Tests para retry.ts
 *
 * VALOR DE ESTOS TESTS:
 * - Verificar que errores de red se reintentan (no falla silenciosamente)
 * - Verificar que errores de lógica NO se reintentan (falla inmediatamente)
 * - Documentar qué errores son considerados "retryables"
 */
import { afterEach,beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

import * as logModule from '../log';
import { isRetryableError, withRetry } from '../retry';

// ============================================================================
// isRetryableError() - Detecta errores transitorios
// ============================================================================

describe('isRetryableError', () => {
  // -------------------------------------------------------------------------
  // CASO 1: Errores que SÍ deben reintentarse (conexión, red, timeouts)
  // -------------------------------------------------------------------------
  describe('errores retryables (deben devolver true)', () => {
    // Cada uno de estos tests protege contra quitar accidentalmente un patrón
    it('detecta "connection" en el mensaje', () => {
      const error = new Error('connection refused by server');
      expect(isRetryableError(error)).toBe(true);
    });

    it('detecta "ROLLBACK" (error de transacción PostgreSQL)', () => {
      const error = new Error('ROLLBACK; transaction aborted');
      expect(isRetryableError(error)).toBe(true);
    });

    it('detecta "timeout"', () => {
      const error = new Error('Request timeout after 30000ms');
      expect(isRetryableError(error)).toBe(true);
    });

    it('detecta "ECONNRESET" (conexión cerrada por servidor)', () => {
      const error = new Error('read ECONNRESET');
      expect(isRetryableError(error)).toBe(true);
    });

    it('detecta "ECONNREFUSED" (servidor no disponible)', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:8055');
      expect(isRetryableError(error)).toBe(true);
    });

    it('detecta "ETIMEDOUT" (timeout de conexión)', () => {
      const error = new Error('connect ETIMEDOUT 192.168.1.1:443');
      expect(isRetryableError(error)).toBe(true);
    });

    it('detecta "socket hang up"', () => {
      const error = new Error('socket hang up');
      expect(isRetryableError(error)).toBe(true);
    });

    it('detecta "network" en el mensaje', () => {
      const error = new Error('Network error occurred');
      expect(isRetryableError(error)).toBe(true);
    });

    // IMPORTANTE: case-insensitive
    it('detecta patrones en cualquier capitalización', () => {
      expect(isRetryableError(new Error('CONNECTION refused'))).toBe(true);
      expect(isRetryableError(new Error('Timeout exceeded'))).toBe(true);
      expect(isRetryableError(new Error('NETWORK failure'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // CASO 2: Errores que NO deben reintentarse (lógica, validación, auth)
  // -------------------------------------------------------------------------
  describe('errores NO retryables (deben devolver false)', () => {
    // Estos tests protegen contra añadir patrones demasiado amplios
    it('NO reintenta errores de sintaxis', () => {
      const error = new Error('Invalid JSON syntax at position 5');
      expect(isRetryableError(error)).toBe(false);
    });

    it('NO reintenta errores de autenticación', () => {
      const error = new Error('Unauthorized: invalid token');
      expect(isRetryableError(error)).toBe(false);
    });

    it('NO reintenta errores de validación', () => {
      const error = new Error('Field "email" is required');
      expect(isRetryableError(error)).toBe(false);
    });

    it('NO reintenta errores de permisos', () => {
      const error = new Error('Forbidden: insufficient permissions');
      expect(isRetryableError(error)).toBe(false);
    });

    it('NO reintenta errores 404', () => {
      const error = new Error('Not found: collection "users" does not exist');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // CASO 3: Edge cases - tipos de entrada inesperados
  // -------------------------------------------------------------------------
  describe('edge cases (entradas no estándar)', () => {
    it('maneja strings en lugar de Error', () => {
      // A veces las librerías lanzan strings directamente
      expect(isRetryableError('connection failed')).toBe(true);
      expect(isRetryableError('invalid data')).toBe(false);
    });

    it('maneja objetos sin propiedad message', () => {
      // Directus a veces devuelve objetos planos
      const weirdError = { code: 500, details: 'connection lost' };
      // String(weirdError) = "[object Object]" - no contiene patrones
      expect(isRetryableError(weirdError)).toBe(false);
    });

    it('maneja null y undefined', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });
});

// ============================================================================
// withRetry() - Ejecuta función con reintentos automáticos
// ============================================================================

describe('withRetry', () => {
  // Silenciamos log.warn para no ensuciar la salida de tests
  let warnSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    warnSpy = spyOn(logModule.log, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // CASO 1: Éxito - la función no falla
  // -------------------------------------------------------------------------
  describe('cuando la función tiene éxito', () => {
    it('devuelve el resultado sin reintentos', async () => {
      const fn = mock(() => Promise.resolve('success'));

      const result = await withRetry(fn, { retries: 3, delayMs: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1); // Solo 1 llamada, sin reintentos
    });
  });

  // -------------------------------------------------------------------------
  // CASO 2: Fallo transitorio seguido de éxito
  // VALOR: Verifica que realmente reintenta y eventualmente tiene éxito
  // -------------------------------------------------------------------------
  describe('cuando falla con error retryable y luego tiene éxito', () => {
    it('reintenta hasta que tiene éxito', async () => {
      let attempts = 0;
      const fn = mock(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('connection refused'));
        }
        return Promise.resolve('success after retries');
      });

      const result = await withRetry(fn, { retries: 5, delayMs: 1 });

      expect(result).toBe('success after retries');
      expect(fn).toHaveBeenCalledTimes(3); // Falló 2 veces, éxito en la 3ra
    });

    it('muestra warning en cada reintento', async () => {
      let attempts = 0;
      const fn = mock(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('connection reset'));
        }
        return Promise.resolve('ok');
      });

      await withRetry(fn, { retries: 3, delayMs: 1, context: 'TestOp' });

      // Verificamos que log.warn fue llamado con el contexto
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('[TestOp]');
      expect(warnSpy.mock.calls[0][0]).toContain('Attempt 1/3');
    });
  });

  // -------------------------------------------------------------------------
  // CASO 3: Fallo permanente - agota todos los reintentos
  // VALOR: Verifica que no reintenta infinitamente
  // -------------------------------------------------------------------------
  describe('cuando falla todos los reintentos', () => {
    it('lanza el error después de agotar reintentos', async () => {
      const fn = mock(() => Promise.reject(new Error('connection timeout')));

      await expect(
        withRetry(fn, { retries: 3, delayMs: 1 })
      ).rejects.toThrow('connection timeout');

      expect(fn).toHaveBeenCalledTimes(3); // Exactamente 3 intentos
    });
  });

  // -------------------------------------------------------------------------
  // CASO 4: Error NO retryable - falla inmediatamente
  // VALOR: Evita perder tiempo reintentando errores que nunca funcionarán
  // -------------------------------------------------------------------------
  describe('cuando el error NO es retryable', () => {
    it('falla inmediatamente sin reintentar', async () => {
      const fn = mock(() => Promise.reject(new Error('Unauthorized: bad token')));

      await expect(
        withRetry(fn, { retries: 5, delayMs: 1 })
      ).rejects.toThrow('Unauthorized: bad token');

      expect(fn).toHaveBeenCalledTimes(1); // Solo 1 intento, NO reintentó
    });

    it('no muestra warnings (no hay reintentos)', async () => {
      const fn = mock(() => Promise.reject(new Error('Invalid syntax')));

      try {
        await withRetry(fn, { retries: 3, delayMs: 1 });
      } catch {
        // Esperado
      }

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // CASO 5: Configuración por defecto
  // VALOR: Documenta los valores por defecto
  // -------------------------------------------------------------------------
  describe('configuración por defecto', () => {
    it('usa 3 reintentos por defecto', async () => {
      const fn = mock(() => Promise.reject(new Error('connection error')));

      try {
        await withRetry(fn, { delayMs: 1 }); // Sin especificar retries
      } catch {
        // Esperado
      }

      expect(fn).toHaveBeenCalledTimes(3); // Default: 3
    });
  });

  // -------------------------------------------------------------------------
  // CASO 6: Backoff exponencial
  // VALOR: Verifica que los delays aumentan (1x, 2x, 3x...)
  // -------------------------------------------------------------------------
  describe('backoff exponencial', () => {
    it('incrementa el delay con cada intento', async () => {
      const delays: number[] = [];
      const originalSetTimeout = globalThis.setTimeout;

      // Interceptamos setTimeout para capturar los delays
      globalThis.setTimeout = ((fn: () => void, ms: number) => {
        delays.push(ms);
        return originalSetTimeout(fn, 1); // Ejecutamos rápido para el test
      }) as typeof setTimeout;

      const fnThatFails = mock(() => Promise.reject(new Error('timeout')));

      try {
        await withRetry(fnThatFails, { retries: 4, delayMs: 100 });
      } catch {
        // Esperado
      } finally {
        globalThis.setTimeout = originalSetTimeout;
      }

      // Backoff: 100*1, 100*2, 100*3 (el 4to intento es el último, no hay delay después)
      expect(delays).toEqual([100, 200, 300]);
    });
  });
});
