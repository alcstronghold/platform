import type { AgeRangeCode, KnowledgeLevelCode } from './auxiliary';
import type { TranslatableEntity, Translation } from './base';

/**
 * Session status
 */
export type SessionStatus = 'draft' | 'published' | 'archived';

/**
 * RPG Session entity - A game session offered by a master
 */
export interface RpgSession extends TranslatableEntity {
  /** Session title (default language) */
  title: string;
  /** Short tagline (max 50 chars) */
  slogan: string | null;
  /** Full description */
  synopsis: string | null;
  /** Master (Directus user) */
  master_id: string;
  /** Optional RPG system reference */
  rpg_system_id: string | null;
  /** Optional RPG edition reference */
  rpg_edition_id: string | null;
  /** Optional setting reference */
  setting_id: string | null;
  /** Associated genres (M2M) */
  genres: number[] | RpgSessionsGenres[];
  /** Age range code */
  age_range: AgeRangeCode;
  /** Minimum players */
  min_players: number;
  /** Maximum players */
  max_players: number;
  /** Minimum duration in minutes */
  min_duration_minutes: number;
  /** Maximum duration in minutes */
  max_duration_minutes: number;
  /** Required knowledge level */
  knowledge_level: KnowledgeLevelCode;
  /** Custom knowledge level description (when knowledge_level = 'other') */
  knowledge_level_other: string | null;
  /** Accessibility options available (M2M) */
  accessibility_options: number[] | RpgSessionsAccessibilityOptions[];
  /** Session languages (M2M) */
  languages: number[] | RpgSessionsLanguages[];
  /** Content warnings (M2M) */
  content_warnings: number[] | RpgSessionsContentWarnings[];
  /** Safety measures used (M2M) */
  safety_measures: number[] | RpgSessionsSafetyMeasures[];
  /** Additional comments */
  comments: string | null;
  /** Current player count (calculated) */
  current_players: number;
}

/**
 * RPG Session translation
 */
export interface RpgSessionTranslation extends Translation {
  rpg_sessions_id: string;
  title: string;
  slogan: string | null;
  synopsis: string | null;
}

// =============================================================================
// Junction tables (M2M relationships)
// =============================================================================

export interface RpgSessionsGenres {
  id: number;
  rpg_sessions_id: string;
  genres_id: string;
}

export interface RpgSessionsAccessibilityOptions {
  id: number;
  rpg_sessions_id: string;
  accessibility_options_id: string;
}

export interface RpgSessionsLanguages {
  id: number;
  rpg_sessions_id: string;
  session_languages_id: string;
}

export interface RpgSessionsContentWarnings {
  id: number;
  rpg_sessions_id: string;
  content_warnings_id: string;
}

export interface RpgSessionsSafetyMeasures {
  id: number;
  rpg_sessions_id: string;
  safety_measures_id: string;
}

// =============================================================================
// Player registration
// =============================================================================

/**
 * Registration status
 */
export type RegistrationStatus = 'registered' | 'waitlist' | 'cancelled';

/**
 * Player registration for a session
 */
export interface RpgSessionPlayer {
  id: number;
  session_id: string;
  user_id: string;
  status: RegistrationStatus;
  registered_at: string;
}
