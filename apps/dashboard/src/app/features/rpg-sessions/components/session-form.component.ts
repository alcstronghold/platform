import type { CatalogItem, CreateRpgSessionData, GenreCatalog, RpgEditionCatalog, RpgFamilyCatalog, RpgSessionDetail, RpgSystemCatalog, SettingCatalog } from '@alcstronghold/domain';
import { SignalFormDescriptor } from '@alcstronghold/infrastructure';
import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormField, max, min, minLength, required } from '@angular/forms/signals';

import { GenrePickerComponent } from '../../../core/components/genre-picker.component';
import type { SelectOption } from '../../../core/components/searchable-select.component';
import { SearchableSelectComponent } from '../../../core/components/searchable-select.component';
import { ToggleOptionListComponent } from '../../../core/components/toggle-option-list.component';

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
  genreIds: string[];
  languageIds: string[];
  accessibilityOptionIds: string[];
  contentWarningIds: string[];
  safetyMeasureIds: string[];
}

@Component({
  selector: 'app-session-form',
  imports: [FormField, GenrePickerComponent, SearchableSelectComponent, ToggleOptionListComponent],
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
      genreIds: [],
      languageIds: [],
      accessibilityOptionIds: [],
      contentWarningIds: [],
      safetyMeasureIds: [],
    },
    (schema) => {
      required(schema.title, { message: 'El título es obligatorio' });

      min(schema.minPlayers, 2, { message: 'El mínimo de jugadores no puede ser menor de 2' });
      max(schema.minPlayers, () => this.descriptor.model().maxPlayers, {
        message: 'El mínimo de jugadores no puede superar el máximo',
      });

      min(schema.maxPlayers, () => this.descriptor.model().minPlayers, {
        message: 'El máximo de jugadores no puede ser menor que el mínimo',
      });
      max(schema.maxPlayers, 20, { message: 'El máximo de jugadores no puede ser mayor de 20' });

      min(schema.minDurationMinutes, 60, { message: 'La duración mínima no puede ser menor de 60 minutos' });
      max(schema.minDurationMinutes, () => this.descriptor.model().maxDurationMinutes, {
        message: 'La duración mínima no puede superar la máxima',
      });

      min(schema.maxDurationMinutes, () => this.descriptor.model().minDurationMinutes, {
        message: 'La duración máxima no puede ser menor que la mínima',
      });
      max(schema.maxDurationMinutes, 480, { message: 'La duración máxima no puede ser mayor de 480 minutos' });

      required(schema.ageRangeId, { message: 'El rango de edad es obligatorio' });
      required(schema.knowledgeLevelId, { message: 'El nivel de conocimiento es obligatorio' });

      minLength(schema.languageIds, 1, { message: 'Selecciona al menos un idioma' });
      minLength(schema.accessibilityOptionIds, 1, { message: 'Selecciona al menos una opción de accesibilidad' });
      minLength(schema.contentWarningIds, 1, { message: 'Selecciona al menos un aviso de contenido' });
      minLength(schema.safetyMeasureIds, 1, { message: 'Selecciona al menos una medida de seguridad' });
    },
  );

  readonly currentStep = signal<1 | 2 | 3>(1);

  // Indica si el paso 1 es válido para habilitar el botón "Continuar"
  readonly step1Valid = computed(() =>
    [
      this.descriptor.form.title(),
      this.descriptor.form.ageRangeId(),
      this.descriptor.form.knowledgeLevelId(),
      this.descriptor.form.minPlayers(),
      this.descriptor.form.maxPlayers(),
      this.descriptor.form.minDurationMinutes(),
      this.descriptor.form.maxDurationMinutes(),
    ].every(f => f.errors().length === 0)
  );

  // Indica si el paso 3 es válido (idiomas, accesibilidad, avisos y medidas obligatorios)
  readonly step3Valid = computed(() =>
    [
      this.descriptor.form.languageIds(),
      this.descriptor.form.accessibilityOptionIds(),
      this.descriptor.form.contentWarningIds(),
      this.descriptor.form.safetyMeasureIds(),
    ].every(f => f.errors().length === 0)
  );

  readonly titleError = computed(() => {
    const field = this.descriptor.form.title();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  readonly ageRangeError = computed(() => {
    const field = this.descriptor.form.ageRangeId();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  readonly knowledgeLevelError = computed(() => {
    const field = this.descriptor.form.knowledgeLevelId();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  readonly playersError = computed(() => {
    const minField = this.descriptor.form.minPlayers();
    const maxField = this.descriptor.form.maxPlayers();
    if (minField.touched() && minField.errors().length > 0) return minField.errors()[0].message;
    if (maxField.touched() && maxField.errors().length > 0) return maxField.errors()[0].message;
    return null;
  });

  readonly durationError = computed(() => {
    const minField = this.descriptor.form.minDurationMinutes();
    const maxField = this.descriptor.form.maxDurationMinutes();
    if (minField.touched() && minField.errors().length > 0) return minField.errors()[0].message;
    if (maxField.touched() && maxField.errors().length > 0) return maxField.errors()[0].message;
    return null;
  });

  readonly languagesError = computed(() => {
    const field = this.descriptor.form.languageIds();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  readonly accessibilityError = computed(() => {
    const field = this.descriptor.form.accessibilityOptionIds();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  readonly contentWarningsError = computed(() => {
    const field = this.descriptor.form.contentWarningIds();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

  readonly safetyMeasuresError = computed(() => {
    const field = this.descriptor.form.safetyMeasureIds();
    return field.touched() && field.errors().length > 0 ? field.errors()[0].message : null;
  });

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

  // Computeds privados para narrowing del tracking en effects (evitan bucles reactivos)
  private readonly _familyId = computed(() => this.descriptor.model().familyId);
  private readonly _editionId = computed(() => this.descriptor.model().editionId);
  private readonly _settingId = computed(() => this.descriptor.model().settingId);

  constructor() {
    effect(() => {
      const familyId = this._familyId();
      if (familyId) this.onFamilyChanged(familyId);
    });

    effect(() => {
      const editionId = this._editionId();
      if (!editionId) return;
      const edition = untracked(() => this.editions().find(e => e.id === editionId));
      if (!edition) return;

      const { familyId, systemId } = untracked(() => this.descriptor.model());
      const updates: Partial<SessionFormFields> = {};
      if (edition.rpgFamilyId && edition.rpgFamilyId !== familyId) updates.familyId = edition.rpgFamilyId;
      if (edition.rpgSystemId && edition.rpgSystemId !== systemId) updates.systemId = edition.rpgSystemId;

      if (Object.keys(updates).length > 0) this.descriptor.updateModel(updates);
    });

    effect(() => {
      const settingId = this._settingId();
      if (!settingId) return;
      const setting = untracked(() => this.settings().find(s => s.id === settingId));
      if (setting?.genreIds.length) this.descriptor.updateModel({ genreIds: setting.genreIds });
    });
  }

  private onFamilyChanged(familyId: string): void {
    const allEditions = untracked(() => this.editions());
    const { editionId, systemId } = untracked(() => this.descriptor.model());
    const updates: Partial<SessionFormFields> = {};

    const editionBelongsToFamily = (id: string) => allEditions.some(e => e.id === id && e.rpgFamilyId === familyId);
    if (editionId && !editionBelongsToFamily(editionId)) updates.editionId = null;

    const validSystemIds = new Set(
      allEditions.filter(e => e.rpgFamilyId === familyId && e.rpgSystemId).map(e => e.rpgSystemId as string)
    );
    if (systemId && !validSystemIds.has(systemId)) updates.systemId = null;

    if (Object.keys(updates).length > 0) this.descriptor.updateModel(updates);
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
      genreIds: data.genreIds,
      languageIds: data.languageIds,
      accessibilityOptionIds: data.accessibilityOptionIds,
      contentWarningIds: data.contentWarningIds,
      safetyMeasureIds: data.safetyMeasureIds,
    });
  }

  goToStep2(): void {
    const step1Fields = [
      this.descriptor.form.title(),
      this.descriptor.form.ageRangeId(),
      this.descriptor.form.knowledgeLevelId(),
      this.descriptor.form.minPlayers(),
      this.descriptor.form.maxPlayers(),
      this.descriptor.form.minDurationMinutes(),
      this.descriptor.form.maxDurationMinutes(),
    ];
    step1Fields.forEach((f) => f.markAsTouched());

    const hasErrors = step1Fields.some((f) => f.errors().length > 0);
    if (!hasErrors) this.currentStep.set(2);
  }

  goToStep3(): void {
    this.currentStep.set(3);
  }

  goToStep1(): void {
    this.currentStep.set(1);
  }

  submit(): void {
    if (!this.descriptor.form().valid()) {
      this.descriptor.form.languageIds().markAsTouched();
      this.descriptor.form.accessibilityOptionIds().markAsTouched();
      this.descriptor.form.contentWarningIds().markAsTouched();
      this.descriptor.form.safetyMeasureIds().markAsTouched();
      return;
    }

    const fields = this.descriptor.model();

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
      genreIds: fields.genreIds,
      accessibilityOptionIds: fields.accessibilityOptionIds,
      languageIds: fields.languageIds,
      contentWarningIds: fields.contentWarningIds,
      safetyMeasureIds: fields.safetyMeasureIds,
    });
  }

  cancel(): void {
    this.formCancel.emit();
  }

  private sortByName<T extends { name: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
}
