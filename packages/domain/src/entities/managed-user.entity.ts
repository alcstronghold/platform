import type { PolicyAssignment } from './policy.entity.js';
import type { Role } from './role.entity.js';
import type { User } from './user.entity.js';

/**
 * Usuario gestionable con rol y policies asignadas.
 * Usado en la vista de administración de usuarios.
 */
export interface ManagedUser extends User {
  role: Role | null;
  policyAssignments: PolicyAssignment[];
}
