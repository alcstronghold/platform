import { Settings, type SettingsData } from '@alcstronghold/infrastructure';
import { Injectable } from '@angular/core';
import { ofetch } from 'ofetch';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private settings: Settings | null = null;
  private loadPromise: Promise<void> | null = null;

  /**
   * Carga la configuración desde archivos JSON incrementales.
   * Idempotente: si ya se está cargando, retorna la misma promise.
   *
   * Orden de carga:
   * 1. config.json (base)
   * 2. config.<environment>.json (development, staging, production)
   * 3. config.local.json (opcional, no hacer commit)
   */
  loadConfig(): Promise<void> {
    if (this.loadPromise != null) return this.loadPromise;
    this.loadPromise = this.doLoadConfig();
    return this.loadPromise;
  }

  private async doLoadConfig(): Promise<void> {
    const configuration = environment.configuration;

    // Cargar archivos en orden con ofetch
    const baseConfig = await this.fetchConfig('config.json');
    const envConfig = await this.fetchConfig(`config.${configuration}.json`);
    const localConfig = await this.fetchConfig('config.local.json', true); // Opcional

    // Merge incremental usando la clase Settings
    let mergedSettings = new Settings(baseConfig ?? {});

    if (envConfig != null) {
      mergedSettings = mergedSettings.merge(envConfig);
    }

    if (localConfig != null) {
      mergedSettings = mergedSettings.merge(localConfig);
    }

    this.settings = mergedSettings;
  }

  get(): Settings {
    if (this.settings == null) {
      throw new Error('ConfigService: config not loaded. Call loadConfig() first in APP_INITIALIZER.');
    }
    return this.settings;
  }

  private async fetchConfig(
    filename: string,
    optional = false
  ): Promise<Partial<SettingsData> | null> {
    try {
      return await ofetch<Partial<SettingsData>>(`/${filename}`);
    } catch (error) {
      if (optional) return null;

      console.error(`Failed to load ${filename}:`, error);
      throw new Error(`ConfigService: Failed to load required config file ${filename}`);
    }
  }
}
