import type { TranslatableEntity, Translation } from './base';

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
