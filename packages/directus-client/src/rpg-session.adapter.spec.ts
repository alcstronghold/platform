import { describe, expect, it } from 'vitest';

import { mapToDirectusPayload, mapToSessionDetail, mapToSessionSummary, resolveTranslatedName } from './rpg-session.adapter.js';

describe('resolveTranslatedName', () => {
  it('should return es-ES translation when available', () => {
    const translations = [
      { languages_code: 'ca-ES', name: 'Fantasia' },
      { languages_code: 'es-ES', name: 'Fantasía' },
    ];
    expect(resolveTranslatedName(translations)).toBe('Fantasía');
  });

  it('should fallback to first translation when locale not found', () => {
    const translations = [
      { languages_code: 'ca-ES', name: 'Fantasia' },
    ];
    expect(resolveTranslatedName(translations)).toBe('Fantasia');
  });

  it('should return empty string for empty translations', () => {
    expect(resolveTranslatedName([])).toBe('');
  });

  it('should return empty string for undefined translations', () => {
    expect(resolveTranslatedName(undefined)).toBe('');
  });

  it('should resolve title field when name is not present', () => {
    const translations = [
      { languages_code: 'es-ES', title: 'Mi sesión' },
    ];
    expect(resolveTranslatedName(translations)).toBe('Mi sesión');
  });
});

describe('mapToSessionSummary', () => {
  const baseItem = {
    id: 'session-1',
    title: 'La Maldición de Strahd',
    slogan: 'Terror gótico',
    status: 'published',
    master_id: { id: 'user-1', first_name: 'Juan', last_name: 'García' },
    rpg_system_id: { id: 'sys-1', translations: [{ languages_code: 'es-ES', name: 'd20 System' }] },
    rpg_edition_id: { id: 'ed-1', translations: [{ languages_code: 'es-ES', name: 'D&D 5e' }] },
    setting_id: { id: 'set-1', translations: [{ languages_code: 'es-ES', name: 'Barovia' }] },
    age_range: { id: 'age-1', translations: [{ languages_code: 'es-ES', name: '+16' }] },
    min_players: 3,
    max_players: 6,
    current_players: 2,
    date_created: '2026-01-15T10:00:00Z',
  };

  it('should map all fields correctly', () => {
    const result = mapToSessionSummary(baseItem);

    expect(result).toEqual({
      id: 'session-1',
      title: 'La Maldición de Strahd',
      slogan: 'Terror gótico',
      status: 'published',
      masterName: 'Juan García',
      masterId: 'user-1',
      rpgSystemName: 'd20 System',
      rpgEditionName: 'D&D 5e',
      settingName: 'Barovia',
      ageRangeName: '+16',
      minPlayers: 3,
      maxPlayers: 6,
      currentPlayers: 2,
      dateCreated: '2026-01-15T10:00:00Z',
    });
  });

  it('should handle null optional relations', () => {
    const result = mapToSessionSummary({
      ...baseItem,
      rpg_system_id: null,
      rpg_edition_id: null,
      setting_id: null,
    });

    expect(result.rpgSystemName).toBeNull();
    expect(result.rpgEditionName).toBeNull();
    expect(result.settingName).toBeNull();
  });

  it('should build master name with only first name', () => {
    const result = mapToSessionSummary({
      ...baseItem,
      master_id: { id: 'user-1', first_name: 'Juan', last_name: null },
    });
    expect(result.masterName).toBe('Juan');
  });

  it('should fallback to "Sin nombre" when master has no name', () => {
    const result = mapToSessionSummary({
      ...baseItem,
      master_id: { id: 'user-1', first_name: null, last_name: null },
    });
    expect(result.masterName).toBe('Sin nombre');
  });
});

describe('mapToSessionDetail', () => {
  const detailItem = {
    id: 'session-1',
    title: 'Aventura épica',
    slogan: null,
    status: 'draft',
    master_id: { id: 'user-1', first_name: 'Ana', last_name: 'López' },
    rpg_system_id: null,
    rpg_edition_id: { id: 'ed-1', rpg_family: 'fam-1', translations: [{ languages_code: 'es-ES', name: 'PF2e' }] },
    setting_id: null,
    age_range: { id: 'age-2', translations: [{ languages_code: 'es-ES', name: '+13' }] },
    min_players: 2,
    max_players: 4,
    current_players: 0,
    date_created: '2026-02-01T12:00:00Z',
    synopsis: 'Una gran aventura...',
    knowledge_level: { id: 'kl-1', translations: [{ languages_code: 'es-ES', name: 'Novato' }] },
    knowledge_level_other: null,
    min_duration_minutes: 90,
    max_duration_minutes: 180,
    comments: 'Traer dados propios',
    genres: [
      { id: 1, genres_id: 'genre-1' },
      { id: 2, genres_id: 'genre-2' },
    ],
    accessibility_options: [],
    languages: [{ id: 1, session_languages_id: 'lang-es' }],
    content_warnings: [{ id: 1, content_warnings_id: 'cw-1' }],
    safety_measures: [{ id: 1, safety_measures_id: 'sm-1' }, { id: 2, safety_measures_id: 'sm-2' }],
  };

  it('should map detail fields including M2M junction IDs', () => {
    const result = mapToSessionDetail(detailItem as any);

    expect(result.synopsis).toBe('Una gran aventura...');
    expect(result.knowledgeLevelId).toBe('kl-1');
    expect(result.knowledgeLevelName).toBe('Novato');
    expect(result.minDurationMinutes).toBe(90);
    expect(result.maxDurationMinutes).toBe(180);
    expect(result.comments).toBe('Traer dados propios');
    expect(result.rpgFamilyId).toBe('fam-1');
    expect(result.rpgEditionId).toBe('ed-1');
    expect(result.ageRangeId).toBe('age-2');
    expect(result.genreIds).toEqual(['genre-1', 'genre-2']);
    expect(result.accessibilityOptionIds).toEqual([]);
    expect(result.languageIds).toEqual(['lang-es']);
    expect(result.contentWarningIds).toEqual(['cw-1']);
    expect(result.safetyMeasureIds).toEqual(['sm-1', 'sm-2']);
  });

  it('should handle null rpgFamilyId when no edition', () => {
    const result = mapToSessionDetail({ ...detailItem, rpg_edition_id: null } as any);
    expect(result.rpgFamilyId).toBeNull();
    expect(result.rpgEditionId).toBeNull();
  });
});

describe('mapToDirectusPayload', () => {
  const data = {
    title: 'Nueva sesión',
    slogan: null,
    synopsis: 'Descripción',
    rpgFamilyId: null,
    rpgEditionId: 'ed-1',
    rpgSystemId: 'sys-1',
    settingId: null,
    ageRangeId: 'age-1',
    knowledgeLevelId: 'kl-1',
    knowledgeLevelOther: null,
    minPlayers: 3,
    maxPlayers: 5,
    minDurationMinutes: 120,
    maxDurationMinutes: 240,
    comments: null,
    genreIds: ['g1', 'g2'],
    accessibilityOptionIds: [],
    languageIds: ['es'],
    contentWarningIds: ['cw1'],
    safetyMeasureIds: [],
  };

  it('should map domain data to Directus format', () => {
    const result = mapToDirectusPayload(data);

    expect(result['title']).toBe('Nueva sesión');
    expect(result['rpg_edition_id']).toBe('ed-1');
    expect(result['rpg_system_id']).toBe('sys-1');
    expect(result['age_range']).toBe('age-1');
    expect(result['min_players']).toBe(3);
    expect(result['max_players']).toBe(5);
  });

  it('should format M2M as junction objects', () => {
    const result = mapToDirectusPayload(data);

    expect(result['genres']).toEqual([
      { genres_id: 'g1' },
      { genres_id: 'g2' },
    ]);
    expect(result['languages']).toEqual([
      { session_languages_id: 'es' },
    ]);
    expect(result['content_warnings']).toEqual([
      { content_warnings_id: 'cw1' },
    ]);
    expect(result['accessibility_options']).toEqual([]);
    expect(result['safety_measures']).toEqual([]);
  });

  it('should include master_id when provided', () => {
    const result = mapToDirectusPayload(data, 'master-1');
    expect(result['master_id']).toBe('master-1');
  });

  it('should not include master_id when not provided', () => {
    const result = mapToDirectusPayload(data);
    expect(result['master_id']).toBeUndefined();
  });
});
