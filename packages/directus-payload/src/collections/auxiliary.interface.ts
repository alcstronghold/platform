import type { LanguageCodes } from '@alcstronghold/directus-schema';

/**
 * Base payload for simple enum-like collections with translations
 */
export interface SimpleEnumPayload {
  identifier: string;
  exclusive_selection?: boolean;
  translations: Record<LanguageCodes, string>;
}

/**
 * Payload for enum collections with name and description translations
 */
export interface DescribedEnumPayload {
  identifier: string;
  exclusive_selection?: boolean;
  translations: Record<LanguageCodes, { name: string; description: string | null }>;
}

// =============================================================================
// Type aliases for specific enum collections
// Using type aliases instead of empty interfaces to satisfy eslint
// =============================================================================

// Simple enums (name only)
export type AgeRangePayload = SimpleEnumPayload;
export type SessionLanguagePayload = SimpleEnumPayload;
export type PronounPayload = SimpleEnumPayload;
export type MembershipStatusPayload = SimpleEnumPayload;
export type GenderIdentityPayload = SimpleEnumPayload;
export type LgbtiqOptionPayload = SimpleEnumPayload;
export type DiscoverySourcePayload = SimpleEnumPayload;

// Described enums (name and description)
export type KnowledgeLevelPayload = DescribedEnumPayload;
export type AccessibilityOptionPayload = DescribedEnumPayload;
export type ContentWarningPayload = DescribedEnumPayload;
export type SafetyMeasurePayload = DescribedEnumPayload;
