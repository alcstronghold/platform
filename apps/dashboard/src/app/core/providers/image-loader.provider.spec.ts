import { IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { provideImageLoader } from './image-loader.provider';

describe('provideImageLoader', () => {
  it('should return an array of providers', () => {
    const providers = provideImageLoader();

    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
  });

  it('should provide IMAGE_LOADER that returns src unchanged', () => {
    TestBed.configureTestingModule({
      providers: [provideImageLoader()],
    });

    const loader = TestBed.inject(IMAGE_LOADER);
    const config: ImageLoaderConfig = { src: 'test.jpg', width: 400 };
    const result = loader(config);

    expect(result).toBe('test.jpg');
  });

  it('should ignore width parameter', () => {
    TestBed.configureTestingModule({
      providers: [provideImageLoader()],
    });

    const loader = TestBed.inject(IMAGE_LOADER);
    const config: ImageLoaderConfig = { src: 'avatar.png', width: 800 };
    const result = loader(config);

    expect(result).toBe('avatar.png');
  });

  it('should handle URLs with query params', () => {
    TestBed.configureTestingModule({
      providers: [provideImageLoader()],
    });

    const loader = TestBed.inject(IMAGE_LOADER);
    const config: ImageLoaderConfig = {
      src: 'https://example.com/image.jpg?quality=90',
      width: 400,
    };
    const result = loader(config);

    expect(result).toBe('https://example.com/image.jpg?quality=90');
  });
});
