import { ApplicationInitStatus, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigService } from '../config/config.service';
import { AuthService } from '../services/auth.service';
import { provideAuthInitialization } from './auth-initialization.provider';

describe('provideAuthInitialization', () => {
  let mockAuthService: {
    initialize: ReturnType<typeof vi.fn>;
  };
  let mockConfigService: {
    loadConfig: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAuthService = {
      initialize: vi.fn().mockResolvedValue(undefined),
    };
    mockConfigService = {
      loadConfig: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should return EnvironmentProviders', () => {
    const provider = provideAuthInitialization();

    expect(provider).toBeDefined();
    expect(typeof provider).toBe('object');
  });

  it('should wait for config then initialize AuthService on app bootstrap', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideAuthInitialization(),
        { provide: ConfigService, useValue: mockConfigService } as Provider,
        { provide: AuthService, useValue: mockAuthService } as Provider,
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(mockConfigService.loadConfig).toHaveBeenCalledOnce();
    expect(mockAuthService.initialize).toHaveBeenCalledOnce();
  });

  it('should propagate errors from config loading', async () => {
    mockConfigService.loadConfig.mockRejectedValueOnce(new Error('Config failed'));

    TestBed.configureTestingModule({
      providers: [
        provideAuthInitialization(),
        { provide: ConfigService, useValue: mockConfigService } as Provider,
        { provide: AuthService, useValue: mockAuthService } as Provider,
      ],
    });

    await expect(TestBed.inject(ApplicationInitStatus).donePromise).rejects.toThrow(
      'Config failed'
    );

    expect(mockAuthService.initialize).not.toHaveBeenCalled();
  });

  it('should complete even if AuthService.initialize() takes time', async () => {
    mockAuthService.initialize.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    TestBed.configureTestingModule({
      providers: [
        provideAuthInitialization(),
        { provide: ConfigService, useValue: mockConfigService } as Provider,
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
