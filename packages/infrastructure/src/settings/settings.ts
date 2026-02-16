// noinspection JSUnusedGlobalSymbols

import { z } from 'zod';

import { isNotBlank } from '../helpers/index.js';

/**
 * Schema Zod para validar configuración de la aplicación.
 */
export const SettingsSchema = z.object({
  directusUrl: z
    .string()
    .url('directusUrl debe ser una URL válida')
    .default('https://backend.alcstronghold.local'),
  production: z.boolean().default(false),
});

/**
 * Tipo inferido del schema Zod.
 */
export type SettingsData = z.infer<typeof SettingsSchema>;

/**
 * Clase de configuración de la aplicación.
 * Usa Zod para validación y transformación de datos.
 */
export class Settings {
  readonly directusUrl: string;
  readonly production: boolean;

  constructor(init?: Settings | Partial<Settings>) {
    // Valores por defecto
    this.directusUrl = 'https://backend.alcstronghold.local';
    this.production = false;

    if (init == null) return;

    // Validar y transformar con Zod
    const parsed = SettingsSchema.parse(init);

    // Asignar valores validados
    Object.assign(this, parsed);
  }

  /**
   * Crea Settings desde JSON sin validación (asume que ya está validado).
   * Útil cuando cargas desde archivos de configuración confiables.
   */
  static fromTrusted(data: Partial<SettingsData>): Settings {
    const parsed = SettingsSchema.parse(data);
    return new Settings(parsed);
  }

  /**
   * Valida si la configuración es válida sin lanzar error.
   */
  static validate(data: unknown): { success: true; data: SettingsData } | { success: false; error: z.ZodError } {
    const result = SettingsSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  }

  /**
   * Merge incremental: combina esta instancia con overrides.
   */
  merge(overrides: Partial<Settings>): Settings {
    return new Settings({
      directusUrl: isNotBlank(overrides.directusUrl) ? overrides.directusUrl : this.directusUrl,
      production: overrides.production ?? this.production,
    });
  }
}
