import type {
  CreateRpgSessionData,
  RpgSessionDetail,
  RpgSessionFilter,
  RpgSessionPort,
  RpgSessionSummary,
  UpdateRpgSessionData,
} from '@alcstronghold/domain';
import { customEndpoint } from '@directus/sdk';
import slugify from 'slugify';

import type { DirectusAuthClient } from './client.js';

// Tipos de respuesta de Directus para rpg_sessions

interface DirectusSessionUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface DirectusSessionSummaryItem {
  id: string;
  title: string;
  slogan: string | null;
  status: string;
  master_id: DirectusSessionUser;
  rpg_system_id: { id: string; translations: DirectusTranslation[] } | null;
  rpg_edition_id: { id: string; translations: DirectusTranslation[] } | null;
  setting_id: { id: string; translations: DirectusTranslation[] } | null;
  age_range: { id: string; translations: DirectusTranslation[] };
  min_players: number;
  max_players: number;
  current_players: number;
  date_created: string;
}

interface DirectusTranslation {
  languages_code: string;
  name?: string;
  title?: string;
}

interface DirectusJunctionItem {
  id: number;
  [key: string]: string | number;
}

interface DirectusSessionDetailItem extends DirectusSessionSummaryItem {
  synopsis: string | null;
  knowledge_level: { id: string; translations: DirectusTranslation[] };
  knowledge_level_other: string | null;
  min_duration_minutes: number;
  max_duration_minutes: number;
  comments: string | null;
  rpg_edition_id: { id: string; rpg_family_id: string | null; translations: DirectusTranslation[] } | null;
  genres: DirectusJunctionItem[];
  accessibility_options: DirectusJunctionItem[];
  languages: DirectusJunctionItem[];
  content_warnings: DirectusJunctionItem[];
  safety_measures: DirectusJunctionItem[];
}

/**
 * Resuelve el nombre traducido desde un array de translations.
 * Prioriza es-ES, fallback al primer elemento.
 */
export function resolveTranslatedName(
  translations: DirectusTranslation[] | undefined,
  locale = 'es-ES',
): string {
  if (!translations?.length) return '';
  const match = translations.find(t => t.languages_code === locale);
  const resolved = match ?? translations[0];
  return resolved?.name ?? resolved?.title ?? '';
}

/**
 * Construye el nombre del master a partir de sus datos
 */
function buildMasterName(master: DirectusSessionUser): string {
  const parts = [master.first_name, master.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Sin nombre';
}

/**
 * Extrae los IDs de las junction tables M2M
 */
function extractJunctionIds(items: DirectusJunctionItem[], foreignKey: string): string[] {
  return items
    .map(item => item[foreignKey] as string)
    .filter(Boolean);
}

export function mapToSessionSummary(item: DirectusSessionSummaryItem): RpgSessionSummary {
  return {
    id: item.id,
    title: item.title,
    slogan: item.slogan,
    status: item.status as RpgSessionSummary['status'],
    masterName: buildMasterName(item.master_id),
    masterId: item.master_id.id,
    rpgSystemName: item.rpg_system_id
      ? resolveTranslatedName(item.rpg_system_id.translations)
      : null,
    rpgEditionName: item.rpg_edition_id
      ? resolveTranslatedName(item.rpg_edition_id.translations)
      : null,
    settingName: item.setting_id
      ? resolveTranslatedName(item.setting_id.translations)
      : null,
    ageRangeName: resolveTranslatedName(item.age_range.translations),
    minPlayers: item.min_players,
    maxPlayers: item.max_players,
    currentPlayers: item.current_players ?? 0,
    dateCreated: item.date_created,
  };
}

export function mapToSessionDetail(item: DirectusSessionDetailItem): RpgSessionDetail {
  const summary = mapToSessionSummary(item);

  return {
    ...summary,
    synopsis: item.synopsis,
    knowledgeLevelId: item.knowledge_level.id,
    knowledgeLevelName: resolveTranslatedName(item.knowledge_level.translations),
    knowledgeLevelOther: item.knowledge_level_other,
    minDurationMinutes: item.min_duration_minutes,
    maxDurationMinutes: item.max_duration_minutes,
    comments: item.comments,
    rpgFamilyId: item.rpg_edition_id?.rpg_family_id ?? null,
    rpgEditionId: item.rpg_edition_id?.id ?? null,
    rpgSystemId: item.rpg_system_id?.id ?? null,
    settingId: item.setting_id?.id ?? null,
    ageRangeId: item.age_range.id,
    genreIds: extractJunctionIds(item.genres ?? [], 'genres_id'),
    accessibilityOptionIds: extractJunctionIds(item.accessibility_options ?? [], 'accessibility_options_id'),
    languageIds: extractJunctionIds(item.languages ?? [], 'session_languages_id'),
    contentWarningIds: extractJunctionIds(item.content_warnings ?? [], 'content_warnings_id'),
    safetyMeasureIds: extractJunctionIds(item.safety_measures ?? [], 'safety_measures_id'),
  };
}

/**
 * Genera un identifier único a partir del título de la sesión.
 * Normaliza a ASCII, reemplaza espacios por guiones y añade sufijo de timestamp.
 */
export function generateSessionIdentifier(title: string): string {
  const slug = slugify(title, { lower: true, strict: true, locale: 'es' });
  return `${slug}-${Date.now().toString(36)}`;
}

/**
 * Convierte datos de dominio al formato Directus para crear/actualizar sesiones
 */
export function mapToDirectusPayload(data: CreateRpgSessionData, masterId?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: data.title,
    identifier: masterId ? generateSessionIdentifier(data.title) : undefined,
    slogan: data.slogan,
    synopsis: data.synopsis,
    rpg_system_id: data.rpgSystemId,
    rpg_edition_id: data.rpgEditionId,
    setting_id: data.settingId,
    age_range: data.ageRangeId,
    knowledge_level: data.knowledgeLevelId,
    knowledge_level_other: data.knowledgeLevelOther,
    min_players: data.minPlayers,
    max_players: data.maxPlayers,
    min_duration_minutes: data.minDurationMinutes,
    max_duration_minutes: data.maxDurationMinutes,
    comments: data.comments,
    genres: data.genreIds.map(id => ({ genres_id: id })),
    accessibility_options: data.accessibilityOptionIds.map(id => ({ accessibility_options_id: id })),
    languages: data.languageIds.map(id => ({ session_languages_id: id })),
    content_warnings: data.contentWarningIds.map(id => ({ content_warnings_id: id })),
    safety_measures: data.safetyMeasureIds.map(id => ({ safety_measures_id: id })),
  };

  if (masterId) {
    payload['master_id'] = masterId;
  }

  return payload;
}

// Fields para consultas de listado
const SUMMARY_FIELDS = [
  'id', 'title', 'slogan', 'status',
  'master_id.id', 'master_id.first_name', 'master_id.last_name',
  'rpg_system_id.id', 'rpg_system_id.translations.languages_code', 'rpg_system_id.translations.name',
  'rpg_edition_id.id', 'rpg_edition_id.translations.languages_code', 'rpg_edition_id.translations.name',
  'setting_id.id', 'setting_id.translations.languages_code', 'setting_id.translations.name',
  'age_range.id', 'age_range.translations.languages_code', 'age_range.translations.name',
  'min_players', 'max_players', 'current_players', 'date_created',
];

// Fields adicionales para detalle
const DETAIL_FIELDS = [
  ...SUMMARY_FIELDS,
  'synopsis', 'knowledge_level_other', 'min_duration_minutes', 'max_duration_minutes', 'comments',
  'knowledge_level.id', 'knowledge_level.translations.languages_code', 'knowledge_level.translations.name',
  'rpg_edition_id.rpg_family_id',
  'genres.id', 'genres.genres_id',
  'accessibility_options.id', 'accessibility_options.accessibility_options_id',
  'languages.id', 'languages.session_languages_id',
  'content_warnings.id', 'content_warnings.content_warnings_id',
  'safety_measures.id', 'safety_measures.safety_measures_id',
];

/**
 * Adapter de Directus para gestión de sesiones de rol.
 * Implementa RpgSessionPort usando customEndpoint del Directus SDK.
 *
 * Se usa customEndpoint en lugar de readItems/readItem porque el SDK
 * de Directus tipea las colecciones custom como `never` cuando no hay
 * schema definido, lo que causa errores con el compilador de Angular.
 */
export class DirectusRpgSessionAdapter implements RpgSessionPort {
  constructor(private readonly client: DirectusAuthClient) {}

  async listSessions(filter?: RpgSessionFilter): Promise<RpgSessionSummary[]> {
    const directusFilter: Record<string, unknown> = {};
    if (filter?.masterId) {
      directusFilter['master_id'] = { _eq: filter.masterId };
    }

    const items = await this.client.request<DirectusSessionSummaryItem[]>(
      customEndpoint<DirectusSessionSummaryItem[]>({
        path: '/items/rpg_sessions',
        params: {
          fields: SUMMARY_FIELDS,
          filter: directusFilter,
          sort: ['-date_created'],
        },
      })
    );

    return items.map(mapToSessionSummary);
  }

  async getSession(id: string): Promise<RpgSessionDetail | null> {
    try {
      const item = await this.client.request<DirectusSessionDetailItem>(
        customEndpoint<DirectusSessionDetailItem>({
          path: `/items/rpg_sessions/${id}`,
          params: {
            fields: DETAIL_FIELDS,
          },
        })
      );
      return mapToSessionDetail(item);
    } catch {
      return null;
    }
  }

  async createSession(masterId: string, data: CreateRpgSessionData): Promise<RpgSessionDetail> {
    const payload = mapToDirectusPayload(data, masterId);

    const created = await this.client.request<{ id: string }>(
      customEndpoint<{ id: string }>({
        path: '/items/rpg_sessions',
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );

    // Recargar con todos los fields para devolver el detalle completo
    const detail = await this.getSession(created.id);
    if (!detail) {
      throw new Error('Error al obtener la sesión recién creada');
    }
    return detail;
  }

  async updateSession(data: UpdateRpgSessionData): Promise<RpgSessionDetail> {
    const payload = mapToDirectusPayload(data);

    await this.client.request(
      customEndpoint<unknown>({
        path: `/items/rpg_sessions/${data.id}`,
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    );

    const detail = await this.getSession(data.id);
    if (!detail) {
      throw new Error('Error al obtener la sesión actualizada');
    }
    return detail;
  }

  async deleteSession(id: string): Promise<void> {
    await this.client.request(
      customEndpoint<null>({
        path: `/items/rpg_sessions/${id}`,
        method: 'DELETE',
      })
    );
  }
}
