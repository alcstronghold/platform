import { ApplicationInitStatus, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigService } from '../config/config.service';
import { provideConfiguration } from './config.provider';

describe('provideConfiguration', () => {
  let mockConfigService: {
    loadConfig: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockConfigService = {
      loadConfig: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should return EnvironmentProviders', () => {
    const provider = provideConfiguration();

    expect(provider).toBeDefined();
    expect(typeof provider).toBe('object');
  });

  it('should initialize ConfigService on app bootstrap', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideConfiguration(),
        { provide: ConfigService, useValue: mockConfigService } as Provider,
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(mockConfigService.loadConfig).toHaveBeenCalledOnce();
  });

  it('should handle loadConfig errors gracefully', async () => {
    mockConfigService.loadConfig.mockRejectedValueOnce(new Error('Network error'));

    TestBed.configureTestingModule({
      providers: [
        provideConfiguration(),
        { provide: ConfigService, useValue: mockConfigService } as Provider,
      ],
    });

    await expect(TestBed.inject(ApplicationInitStatus).donePromise).rejects.toThrow('Network error');
  });
});
