import type {
  CatalogItem,
  CatalogPort,
  GenreCatalog,
  RpgEditionCatalog,
  RpgFamilyCatalog,
  RpgSystemCatalog,
  SettingCatalog,
} from '@alcstronghold/domain';
import { computed, inject, Injectable, signal } from '@angular/core';

import { CATALOG_PORT } from '../providers/directus.provider';

interface CatalogState {
  families: RpgFamilyCatalog[];
  editions: RpgEditionCatalog[];
  systems: RpgSystemCatalog[];
  settings: SettingCatalog[];
  genres: GenreCatalog[];
  ageRanges: CatalogItem[];
  knowledgeLevels: CatalogItem[];
  accessibilityOptions: CatalogItem[];
  sessionLanguages: CatalogItem[];
  contentWarnings: CatalogItem[];
  safetyMeasures: CatalogItem[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly port: CatalogPort = inject(CATALOG_PORT);

  private readonly state = signal<CatalogState>({
    families: [],
    editions: [],
    systems: [],
    settings: [],
    genres: [],
    ageRanges: [],
    knowledgeLevels: [],
    accessibilityOptions: [],
    sessionLanguages: [],
    contentWarnings: [],
    safetyMeasures: [],
    isLoading: false,
    error: null,
  });

  readonly families = computed(() => this.state().families);
  readonly editions = computed(() => this.state().editions);
  readonly systems = computed(() => this.state().systems);
  readonly settings = computed(() => this.state().settings);
  readonly genres = computed(() => this.state().genres);
  readonly ageRanges = computed(() => this.state().ageRanges);
  readonly knowledgeLevels = computed(() => this.state().knowledgeLevels);
  readonly accessibilityOptions = computed(() => this.state().accessibilityOptions);
  readonly sessionLanguages = computed(() => this.state().sessionLanguages);
  readonly contentWarnings = computed(() => this.state().contentWarnings);
  readonly safetyMeasures = computed(() => this.state().safetyMeasures);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  /** Carga todos los catálogos en paralelo */
  async loadAll(): Promise<void> {
    this.patchState({ isLoading: true, error: null });
    try {
      const [
        families, editions, systems, settings, genres,
        ageRanges, knowledgeLevels, accessibilityOptions,
        sessionLanguages, contentWarnings, safetyMeasures,
      ] = await Promise.all([
        this.port.listRpgFamilies(),
        this.port.listRpgEditions(),
        this.port.listRpgSystems(),
        this.port.listSettings(),
        this.port.listGenres(),
        this.port.listAgeRanges(),
        this.port.listKnowledgeLevels(),
        this.port.listAccessibilityOptions(),
        this.port.listSessionLanguages(),
        this.port.listContentWarnings(),
        this.port.listSafetyMeasures(),
      ]);

      this.patchState({
        families, editions, systems, settings, genres,
        ageRanges, knowledgeLevels, accessibilityOptions,
        sessionLanguages, contentWarnings, safetyMeasures,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar catálogos';
      this.patchState({ isLoading: false, error: message });
    }
  }

  /** Ediciones filtradas por familia RPG */
  editionsByFamily(familyId: string | null): RpgEditionCatalog[] {
    if (!familyId) return this.editions();
    return this.editions().filter(e => e.rpgFamilyId === familyId);
  }

  /** Settings filtrados por familia RPG */
  settingsByFamily(familyId: string | null): SettingCatalog[] {
    if (!familyId) return this.settings();
    return this.settings().filter(s => s.rpgFamilyIds.includes(familyId));
  }

  /** Géneros asociados a un setting */
  genresBySetting(settingId: string | null): GenreCatalog[] {
    if (!settingId) return this.genres();
    const setting = this.settings().find(s => s.id === settingId);
    if (!setting) return this.genres();
    return this.genres().filter(g => setting.genreIds.includes(g.id));
  }

  private patchState(patch: Partial<CatalogState>): void {
    this.state.update(current => ({ ...current, ...patch }));
  }
}
