import type { TranslatableEntity, Translation } from './base';

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
