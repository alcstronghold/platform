import type { CatalogItem, CreateRpgSessionData, GenreCatalog, RpgEditionCatalog, RpgFamilyCatalog, RpgSessionDetail, RpgSystemCatalog, SettingCatalog } from '@alcstronghold/domain';
import { SignalFormDescriptor } from '@alcstronghold/infrastructure';
import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormField, required } from '@angular/forms/signals';

import type { SelectOption } from '../../../core/components/searchable-select.component';
import { SearchableSelectComponent } from '../../../core/components/searchable-select.component';

interface SessionFormFields {
  title: string;
  slogan: string;
  synopsis: string;
  comments: string;
  familyId: string | null;
  editionId: string | null;
  systemId: string | null;
  settingId: string | null;
  ageRangeId: string | null;
  knowledgeLevelId: string | null;
  knowledgeLevelOther: string;
  minPlayers: number;
  maxPlayers: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
}

@Component({
  selector: 'app-session-form',
  imports: [FormField, SearchableSelectComponent],
  templateUrl: './session-form.component.html',
})
export class SessionFormComponent {
  // Inputs del catálogo
  readonly families = input<RpgFamilyCatalog[]>([]);
  readonly editions = input<RpgEditionCatalog[]>([]);
  readonly systems = input<RpgSystemCatalog[]>([]);
  readonly settings = input<SettingCatalog[]>([]);
  readonly genres = input<GenreCatalog[]>([]);
  readonly ageRanges = input<CatalogItem[]>([]);
  readonly knowledgeLevels = input<CatalogItem[]>([]);
  readonly accessibilityOptions = input<CatalogItem[]>([]);
  readonly sessionLanguages = input<CatalogItem[]>([]);
  readonly contentWarnings = input<CatalogItem[]>([]);
  readonly safetyMeasures = input<CatalogItem[]>([]);

  readonly initialData = input<RpgSessionDetail | null>(null);
  readonly isSubmitting = input(false);
  readonly submitLabel = input('Guardar');

  readonly formSubmit = output<CreateRpgSessionData>();
  readonly formCancel = output<void>();

  readonly descriptor = new SignalFormDescriptor<SessionFormFields>(
    {
      title: '',
      slogan: '',
      synopsis: '',
      comments: '',
      familyId: null,
      editionId: null,
      systemId: null,
      settingId: null,
      ageRangeId: null,
      knowledgeLevelId: null,
      knowledgeLevelOther: '',
      minPlayers: 2,
      maxPlayers: 6,
      minDurationMinutes: 120,
      maxDurationMinutes: 240,
    },
    (schema) => {
      required(schema.title, { message: 'El título es obligatorio' });
    },
  );

  // Signals para campos multi-valor (Sets), no van en el descriptor
  readonly selectedGenreIds = signal(new Set<string>());
  readonly selectedAccessibilityIds = signal(new Set<string>());
  readonly selectedLanguageIds = signal(new Set<string>());
  readonly selectedContentWarningIds = signal(new Set<string>());
  readonly selectedSafetyMeasureIds = signal(new Set<string>());

  readonly titleError = computed(() => {
    const field = this.descriptor.form.title();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });
  readonly playersError = signal<string | null>(null);
  readonly durationError = signal<string | null>(null);

  // Opciones para los dropdowns (formato { value, name, preferred? })
  readonly familyOptions = computed<SelectOption[]>(() =>
    this.sortByName(this.families()).map(f => ({ value: f.id, name: f.name }))
  );

  readonly editionOptions = computed<SelectOption[]>(() => {
    const familyId = this.descriptor.model().familyId;
    const all = familyId ? this.editions().filter(e => e.rpgFamilyId === familyId) : this.editions();
    return this.sortByName(all).map(e => ({ value: e.id, name: e.name }));
  });

  readonly systemOptions = computed<SelectOption[]>(() => {
    const familyId = this.descriptor.model().familyId;
    if (!familyId) return this.sortByName(this.systems()).map(s => ({ value: s.id, name: s.name }));
    const validIds = new Set(
      this.editions().filter(e => e.rpgFamilyId === familyId && e.rpgSystemId).map(e => e.rpgSystemId as string)
    );
    return this.sortByName(this.systems().filter(s => validIds.has(s.id))).map(s => ({ value: s.id, name: s.name }));
  });

  readonly settingOptions = computed<SelectOption[]>(() => {
    const familyId = this.descriptor.model().familyId;
    const familySettingIds = new Set(
      familyId ? (this.families().find(f => f.id === familyId)?.settingIds ?? []) : []
    );
    return this.sortByName(this.settings()).map(s => ({
      value: s.id,
      name: s.name,
      preferred: familySettingIds.has(s.id) || undefined,
    }));
  });

  readonly ageRangeOptions = computed<SelectOption[]>(() =>
    this.ageRanges().map(a => ({ value: a.id, name: a.name }))
  );

  readonly knowledgeLevelOptions = computed<SelectOption[]>(() =>
    this.knowledgeLevels().map(l => ({ value: l.id, name: l.name }))
  );

  readonly genreOptions = computed(() => this.sortByName(this.genres()));

  // Géneros sugeridos por el setting seleccionado
  readonly suggestedGenreIds = computed(() => {
    const settingId = this.descriptor.model().settingId;
    if (!settingId) return new Set<string>();
    const setting = this.settings().find(s => s.id === settingId);
    return new Set(setting?.genreIds ?? []);
  });

  readonly isKnowledgeLevelOther = computed(() => {
    const levelId = this.descriptor.model().knowledgeLevelId;
    if (!levelId) return false;
    const level = this.knowledgeLevels().find(l => l.id === levelId);
    return level?.identifier === 'other';
  });

  constructor() {
    effect(() => this.onFamilyChanged());
    effect(() => this.onEditionChanged());
    effect(() => this.onSettingChanged());
  }

  private onFamilyChanged(): void {
    const { familyId, editionId, systemId } = this.descriptor.model();
    if (!familyId) return;

    const allEditions = untracked(() => this.editions());
    const updates: Partial<SessionFormFields> = {};

    if (editionId && !allEditions.some(e => e.id === editionId && e.rpgFamilyId === familyId)) {
      updates.editionId = null;
    }

    const validSystemIds = new Set(
      allEditions.filter(e => e.rpgFamilyId === familyId && e.rpgSystemId).map(e => e.rpgSystemId as string)
    );
    if (systemId && !validSystemIds.has(systemId)) {
      updates.systemId = null;
    }

    if (Object.keys(updates).length > 0) this.descriptor.updateModel(updates);
  }

  private onEditionChanged(): void {
    const { editionId, familyId, systemId } = this.descriptor.model();
    if (!editionId) return;

    const edition = untracked(() => this.editions().find(e => e.id === editionId));
    if (!edition) return;

    const updates: Partial<SessionFormFields> = {};
    if (edition.rpgFamilyId && edition.rpgFamilyId !== familyId) updates.familyId = edition.rpgFamilyId;
    if (edition.rpgSystemId && edition.rpgSystemId !== systemId) updates.systemId = edition.rpgSystemId;

    if (Object.keys(updates).length > 0) this.descriptor.updateModel(updates);
  }

  private onSettingChanged(): void {
    const settingId = this.descriptor.model().settingId;
    if (!settingId) return;
    const setting = untracked(() => this.settings().find(s => s.id === settingId));
    if (setting?.genreIds.length) this.selectedGenreIds.set(new Set(setting.genreIds));
  }

  loadData(data: RpgSessionDetail): void {
    this.descriptor.reset({
      title: data.title,
      slogan: data.slogan ?? '',
      synopsis: data.synopsis ?? '',
      comments: data.comments ?? '',
      familyId: data.rpgFamilyId,
      editionId: data.rpgEditionId,
      systemId: data.rpgSystemId,
      settingId: data.settingId,
      ageRangeId: data.ageRangeId || null,
      knowledgeLevelId: data.knowledgeLevelId || null,
      knowledgeLevelOther: data.knowledgeLevelOther ?? '',
      minPlayers: data.minPlayers,
      maxPlayers: data.maxPlayers,
      minDurationMinutes: data.minDurationMinutes,
      maxDurationMinutes: data.maxDurationMinutes,
    });
    this.selectedGenreIds.set(new Set(data.genreIds));
    this.selectedAccessibilityIds.set(new Set(data.accessibilityOptionIds));
    this.selectedLanguageIds.set(new Set(data.languageIds));
    this.selectedContentWarningIds.set(new Set(data.contentWarningIds));
    this.selectedSafetyMeasureIds.set(new Set(data.safetyMeasureIds));
  }

  toggleSet(setSignal: typeof this.selectedGenreIds, id: string): void {
    const current = new Set(setSignal());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    setSignal.set(current);
  }

  isInSet(setSignal: typeof this.selectedGenreIds, id: string): boolean {
    return setSignal().has(id);
  }

  submit(): void {
    this.playersError.set(null);
    this.durationError.set(null);

    if (!this.descriptor.form().valid()) {
      this.descriptor.form.title().markAsTouched();
      return;
    }

    const fields = this.descriptor.model();

    if (fields.minPlayers > fields.maxPlayers) {
      this.playersError.set('El mínimo de jugadores no puede ser mayor al máximo');
      return;
    }
    if (fields.minDurationMinutes > fields.maxDurationMinutes) {
      this.durationError.set('La duración mínima no puede ser mayor a la máxima');
      return;
    }

    this.formSubmit.emit({
      title: fields.title.trim(),
      slogan: fields.slogan.trim() || null,
      synopsis: fields.synopsis.trim() || null,
      rpgFamilyId: fields.familyId,
      rpgEditionId: fields.editionId,
      rpgSystemId: fields.systemId,
      settingId: fields.settingId,
      ageRangeId: fields.ageRangeId ?? '',
      knowledgeLevelId: fields.knowledgeLevelId ?? '',
      knowledgeLevelOther: fields.knowledgeLevelOther.trim() || null,
      minPlayers: fields.minPlayers,
      maxPlayers: fields.maxPlayers,
      minDurationMinutes: fields.minDurationMinutes,
      maxDurationMinutes: fields.maxDurationMinutes,
      comments: fields.comments.trim() || null,
      genreIds: [...this.selectedGenreIds()],
      accessibilityOptionIds: [...this.selectedAccessibilityIds()],
      languageIds: [...this.selectedLanguageIds()],
      contentWarningIds: [...this.selectedContentWarningIds()],
      safetyMeasureIds: [...this.selectedSafetyMeasureIds()],
    });
  }

  cancel(): void {
    this.formCancel.emit();
  }

  private sortByName<T extends { name: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
