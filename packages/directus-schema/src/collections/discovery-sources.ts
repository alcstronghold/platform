import type { TranslatableEntity, Translation } from './base';

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
