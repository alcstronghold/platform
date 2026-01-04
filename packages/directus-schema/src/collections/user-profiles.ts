import type {
  GenderIdentityCode,
  LgbtiqOptionCode,
  MembershipStatusCode,
  PronounCode,
} from './auxiliary';

/**
 * User profile - Extension of directus_users with custom fields
 *
 * This is a 1:1 relationship with directus_users. Each Directus user
 * can have one associated profile with additional data.
 */
export interface UserProfile {
  id: string;
  /** Reference to directus_users.id */
  user_id: string;

  // -------------------------------------------------------------------------
  // Basic data (required for registration)
  // -------------------------------------------------------------------------

  /** First name */
  first_name: string;
  /** Last name */
  last_name: string;
  /** Public alias/nickname (optional) */
  alias: string | null;
  /** Phone number (optional) */
  phone: string | null;
  /** Telegram handle (optional) */
  telegram_handle: string | null;
  /** Pronoun preference */
  pronouns: PronounCode;
  /** Custom pronouns (when pronouns = 'other') */
  pronouns_other: string | null;

  // -------------------------------------------------------------------------
  // Event data (for in-person events)
  // -------------------------------------------------------------------------

  /** Birth date */
  birth_date: string | null;
  /** Whether user is 18+ (calculated from birth_date or self-declared) */
  is_adult: boolean;
  /** Guardian name (required if !is_adult) */
  guardian_name: string | null;
  /** Special accessibility needs for events */
  accessibility_needs: string | null;
  /** Membership status */
  membership_status: MembershipStatusCode;

  // -------------------------------------------------------------------------
  // Statistical indicators (optional, for demographics)
  // -------------------------------------------------------------------------

  /** Whether statistical data has been completed */
  stats_completed: boolean;
  /** Nationality/ethnicity (free text, optional) */
  nationality_ethnicity: string | null;
  /** Gender identity (optional) */
  gender_identity: GenderIdentityCode | null;
  /** LGBTIQ+ community (optional) */
  lgbtiq_community: LgbtiqOptionCode | null;
  /** How user discovered the organization (M2M) */
  discovery_sources: number[] | UserProfilesDiscoverySources[];
}

/**
 * Junction table: user_profiles <-> discovery_sources (M2M)
 */
export interface UserProfilesDiscoverySources {
  id: number;
  user_profiles_id: string;
  discovery_sources_id: string;
}
