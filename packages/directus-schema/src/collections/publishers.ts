import type { IdentifiableEntity } from './base';

/**
 * Publisher entity
 */
export interface Publisher extends IdentifiableEntity {
  name: string;
  website: string | null;
  logo: string | null;
}