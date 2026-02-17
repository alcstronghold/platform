import type { ManagedUser } from '../entities/managed-user.entity.js';
import type { Policy, PolicyAssignment } from '../entities/policy.entity.js';
import type { Role } from '../entities/role.entity.js';

/**
 * Datos necesarios para crear un usuario
 */
export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

/**
 * Puerto para la gestión de usuarios, roles y policies
 */
export interface UserManagementPort {
  listUsers(): Promise<ManagedUser[]>;
  createUser(data: CreateUserData): Promise<ManagedUser>;
  updateUserRole(userId: string, roleId: string): Promise<void>;
  listRoles(): Promise<Role[]>;
  listPolicies(): Promise<Policy[]>;
  getUserPolicyAssignments(userId: string): Promise<PolicyAssignment[]>;
  assignPolicy(userId: string, policyId: string): Promise<PolicyAssignment>;
  removePolicy(assignmentId: string): Promise<void>;
}
