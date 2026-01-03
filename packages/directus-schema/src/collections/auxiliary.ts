import type { TranslatableEntity, Translation } from './base';

// =============================================================================
// AGE RANGES
// =============================================================================

/**
 * Age range options for sessions
 * Values: '6-9', '10-12', '+13', '+16', '+18'
 */
export interface AgeRange extends TranslatableEntity {
  name: string;
}

export interface AgeRangeTranslation extends Translation {
  age_ranges_id: string;
  name: string;
}

export type AgeRangeCode = '6-9' | '10-12' | '+13' | '+16' | '+18';

// =============================================================================
// KNOWLEDGE LEVELS
// =============================================================================

/**
 * Player knowledge level requirements
 * Values: 'novice', 'familiar', 'immersive', 'other'
 */
export interface KnowledgeLevel extends TranslatableEntity {
  name: string;
}

export interface KnowledgeLevelTranslation extends Translation {
  knowledge_levels_id: string;
  name: string;
  description: string | null;
}

export type KnowledgeLevelCode = 'novice' | 'familiar' | 'immersive' | 'other';

// =============================================================================
// ACCESSIBILITY OPTIONS
// =============================================================================

/**
 * Accessibility accommodations available
 * Values: 'visual', 'auditory', 'reading', 'other'
 */
export interface AccessibilityOption extends TranslatableEntity {
  name: string;
}

export interface AccessibilityOptionTranslation extends Translation {
  accessibility_options_id: string;
  name: string;
  description: string | null;
}

export type AccessibilityOptionCode = 'visual' | 'auditory' | 'reading' | 'other';

// =============================================================================
// SESSION LANGUAGES
// =============================================================================

/**
 * Languages available for sessions
 * Values: 'es', 'ca', 'en', 'decided_by_group'
 */
export interface SessionLanguage extends TranslatableEntity {
  name: string;
}

export interface SessionLanguageTranslation extends Translation {
  session_languages_id: string;
  name: string;
}

export type SessionLanguageCode = 'es' | 'ca' | 'en' | 'decided_by_group';

// =============================================================================
// CONTENT WARNINGS
// =============================================================================

/**
 * Content warnings for sessions
 * Values: 'none', 'violence', 'hospitals', 'mental_health', 'discrimination', 'sexual_violence', 'other'
 */
export interface ContentWarning extends TranslatableEntity {
  name: string;
}

export interface ContentWarningTranslation extends Translation {
  content_warnings_id: string;
  name: string;
  description: string | null;
}

export type ContentWarningCode =
  | 'none'
  | 'violence'
  | 'hospitals'
  | 'mental_health'
  | 'discrimination'
  | 'sexual_violence'
  | 'other';

// =============================================================================
// SAFETY MEASURES
// =============================================================================

/**
 * Safety tools used in sessions
 * Values: 'x_card', 'semaphore', 'luxton', 'open_door', 'lines_veils', 'other'
 */
export interface SafetyMeasure extends TranslatableEntity {
  name: string;
}

export interface SafetyMeasureTranslation extends Translation {
  safety_measures_id: string;
  name: string;
  description: string | null;
}

export type SafetyMeasureCode =
  | 'x_card'
  | 'semaphore'
  | 'luxton'
  | 'open_door'
  | 'lines_veils'
  | 'other';

// =============================================================================
// PRONOUNS
// =============================================================================

/**
 * Pronoun options for user profiles
 * Values: 'elli', 'ella', 'ell', 'other'
 */
export interface Pronoun extends TranslatableEntity {
  name: string;
}

export interface PronounTranslation extends Translation {
  pronouns_id: string;
  name: string;
}

export type PronounCode = 'elli' | 'ella' | 'ell' | 'other';

// =============================================================================
// MEMBERSHIP STATUSES
// =============================================================================

/**
 * Membership status for users
 * Values: 'member', 'needs_renewal', 'wants_to_join', 'guest'
 */
export interface MembershipStatus extends TranslatableEntity {
  name: string;
}

export interface MembershipStatusTranslation extends Translation {
  membership_statuses_id: string;
  name: string;
}

export type MembershipStatusCode = 'member' | 'needs_renewal' | 'wants_to_join' | 'guest';

// =============================================================================
// GENDER IDENTITIES
// =============================================================================

/**
 * Gender identity options for statistics
 * Values: 'woman', 'man', 'non_binary', 'not_listed'
 */
export interface GenderIdentity extends TranslatableEntity {
  name: string;
}

export interface GenderIdentityTranslation extends Translation {
  gender_identities_id: string;
  name: string;
}

export type GenderIdentityCode = 'woman' | 'man' | 'non_binary' | 'not_listed';

// =============================================================================
// LGBTIQ OPTIONS
// =============================================================================

/**
 * LGBTIQ+ community options for statistics
 * Values: 'yes', 'no', 'unsure', 'ally'
 */
export interface LgbtiqOption extends TranslatableEntity {
  name: string;
}

export interface LgbtiqOptionTranslation extends Translation {
  lgbtiq_options_id: string;
  name: string;
}

export type LgbtiqOptionCode = 'yes' | 'no' | 'unsure' | 'ally';

// =============================================================================
// DISCOVERY SOURCES
// =============================================================================

/**
 * How users discovered the organization
 * Values: 'friends', 'other_association', 'telegram', 'whatsapp', 'instagram', 'facebook', 'bluesky', 'other'
 */
export interface DiscoverySource extends TranslatableEntity {
  name: string;
}

export interface DiscoverySourceTranslation extends Translation {
  discovery_sources_id: string;
  name: string;
}

export type DiscoverySourceCode =
  | 'friends'
  | 'other_association'
  | 'telegram'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'bluesky'
  | 'other';
