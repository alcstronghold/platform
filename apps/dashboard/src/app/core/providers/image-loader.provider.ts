import { IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
import type { Provider } from '@angular/core';

/**
 * Proporciona el loader genérico de imágenes para NgOptimizedImage.
 * Este loader NO aplica transformaciones (no usa CDN).
 * Retorna la URL de la imagen tal cual, sin modificar ancho ni formato.
 */
export function provideImageLoader(): Provider[] {
  return [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => config.src,
    },
  ];
}
