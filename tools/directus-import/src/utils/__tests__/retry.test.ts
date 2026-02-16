/**
 * Tests para retry.ts
 *
 * VALOR DE ESTOS TESTS:
 * - Verificar que errores de red se reintentan (no falla silenciosamente)
 * - Verificar que errores de lógica NO se reintentan (falla inmediatamente)
 * - Documentar qué errores son considerados "retryables"
 */
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

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

// Helper: crea función que falla N veces y luego tiene éxito
function createFailingThenSuccessFn(failCount: number, errorMsg: string, successValue: string) {
  let attempts = 0;
  return mock(() => {
    attempts++;
    if (attempts <= failCount) {
      return Promise.reject(new Error(errorMsg));
    }
    return Promise.resolve(successValue);
  });
}

// Helper: ejecuta withRetry esperando que falle
async function expectWithRetryToFail(fn: () => Promise<unknown>, options: { retries?: number; delayMs: number }) {
  try {
    await withRetry(fn, options);
  } catch {
    // Esperado
  }
}

describe('withRetry', () => {
  let warnSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    warnSpy = spyOn(logModule.log, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('devuelve el resultado sin reintentos cuando tiene éxito', async () => {
    const fn = mock(() => Promise.resolve('success'));
    const result = await withRetry(fn, { retries: 3, delayMs: 1 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('reintenta hasta que tiene éxito con error retryable', async () => {
    const fn = createFailingThenSuccessFn(2, 'connection refused', 'success after retries');
    const result = await withRetry(fn, { retries: 5, delayMs: 1 });

    expect(result).toBe('success after retries');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('muestra warning en cada reintento con contexto', async () => {
    const fn = createFailingThenSuccessFn(1, 'connection reset', 'ok');
    await withRetry(fn, { retries: 3, delayMs: 1, context: 'TestOp' });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('[TestOp]');
    expect(warnSpy.mock.calls[0][0]).toContain('Attempt 1/3');
  });

  it('lanza el error después de agotar reintentos', async () => {
    const fn = mock(() => Promise.reject(new Error('connection timeout')));

    expect(withRetry(fn, { retries: 3, delayMs: 1 })).rejects.toThrow('connection timeout');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('falla inmediatamente sin reintentar con error NO retryable', async () => {
    const fn = mock(() => Promise.reject(new Error('Unauthorized: bad token')));

    expect(withRetry(fn, { retries: 5, delayMs: 1 })).rejects.toThrow('Unauthorized: bad token');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('no muestra warnings cuando el error no es retryable', async () => {
    const fn = mock(() => Promise.reject(new Error('Invalid syntax')));
    await expectWithRetryToFail(fn, { retries: 3, delayMs: 1 });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('usa 3 reintentos por defecto', async () => {
    const fn = mock(() => Promise.reject(new Error('connection error')));
    await expectWithRetryToFail(fn, { delayMs: 1 });

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('incrementa el delay con backoff exponencial', async () => {
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;

    globalThis.setTimeout = ((fn: () => void, ms: number) => {
      delays.push(ms);
      return originalSetTimeout(fn, 1);
    }) as typeof setTimeout;

    const fnThatFails = mock(() => Promise.reject(new Error('timeout')));

    try {
      await expectWithRetryToFail(fnThatFails, { retries: 4, delayMs: 100 });
    } finally {
      globalThis.setTimeout = originalSetTimeout;
    }

    expect(delays).toEqual([100, 200, 300]);
  });
});
