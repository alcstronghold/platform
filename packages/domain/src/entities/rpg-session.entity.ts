/**
 * Estado de una sesión de rol
 */
export type RpgSessionStatus = 'draft' | 'published' | 'archived';

/**
 * Resumen de sesión para listados
 */
export interface RpgSessionSummary {
  id: string;
  title: string;
  slogan: string | null;
  status: RpgSessionStatus;
  masterName: string;
  masterId: string;
  rpgSystemName: string | null;
  rpgEditionName: string | null;
  settingName: string | null;
  ageRangeName: string;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  dateCreated: string;
}

/**
 * Detalle completo de sesión para formulario de edición
 */
export interface RpgSessionDetail extends RpgSessionSummary {
  synopsis: string | null;
  knowledgeLevelId: string;
  knowledgeLevelName: string;
  knowledgeLevelOther: string | null;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  comments: string | null;
  rpgFamilyId: string | null;
  rpgEditionId: string | null;
  rpgSystemId: string | null;
  settingId: string | null;
  ageRangeId: string;
  genreIds: string[];
  accessibilityOptionIds: string[];
  languageIds: string[];
  contentWarningIds: string[];
  safetyMeasureIds: string[];
}

/**
 * Datos para crear una sesión de rol
 */
export interface CreateRpgSessionData {
  title: string;
  slogan: string | null;
  synopsis: string | null;
  rpgFamilyId: string | null;
  rpgEditionId: string | null;
  rpgSystemId: string | null;
  settingId: string | null;
  ageRangeId: string;
  knowledgeLevelId: string;
  knowledgeLevelOther: string | null;
  minPlayers: number;
  maxPlayers: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  comments: string | null;
  genreIds: string[];
  accessibilityOptionIds: string[];
  languageIds: string[];
  contentWarningIds: string[];
  safetyMeasureIds: string[];
}

/**
 * Datos para actualizar una sesión existente
 */
export interface UpdateRpgSessionData extends CreateRpgSessionData {
  id: string;
}
