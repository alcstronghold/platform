import { ApplicationInitStatus, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../services/auth.service';
import { provideAuthInitialization } from './auth-initialization.provider';

describe('provideAuthInitialization', () => {
  let mockAuthService: {
    initialize: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAuthService = {
      initialize: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should return EnvironmentProviders', () => {
    const provider = provideAuthInitialization();

    expect(provider).toBeDefined();
    expect(typeof provider).toBe('object');
  });

  it('should initialize AuthService on app bootstrap', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideAuthInitialization(),
        { provide: AuthService, useValue: mockAuthService } as Provider,
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(mockAuthService.initialize).toHaveBeenCalledOnce();
  });

  it('should propagate initialization errors to APP_INITIALIZER', async () => {
    mockAuthService.initialize.mockRejectedValueOnce(new Error('Network error'));

    TestBed.configureTestingModule({
      providers: [
        provideAuthInitialization(),
        { provide: AuthService, useValue: mockAuthService } as Provider,
      ],
    });

    // APP_INITIALIZER propaga errores (AuthService.initialize tiene try-catch pero retorna Promise)
    await expect(TestBed.inject(ApplicationInitStatus).donePromise).rejects.toThrow(
      'Network error'
    );

    expect(mockAuthService.initialize).toHaveBeenCalledOnce();
  });

  it('should complete even if AuthService.initialize() takes time', async () => {
    mockAuthService.initialize.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    TestBed.configureTestingModule({
      providers: [
        provideAuthInitialization(),
        { provide: AuthService, useValue: mockAuthService } as Provider,
      ],
    });

    const start = Date.now();
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const elapsed = Date.now() - start;

    expect(mockAuthService.initialize).toHaveBeenCalledOnce();
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});
