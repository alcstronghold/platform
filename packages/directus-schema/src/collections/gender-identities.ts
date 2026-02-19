import type { TranslatableEntity, Translation } from './base';

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
