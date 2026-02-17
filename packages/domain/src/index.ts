// Entities
export type { AuthenticatedUser, User, UserRole } from './entities/index.js';
export type { ManagedUser } from './entities/index.js';
export type { Role } from './entities/index.js';
export type { Policy, PolicyAssignment } from './entities/index.js';
export { computeDisplayName, toAuthenticatedUser } from './entities/index.js';

// Ports
export type { AuthPort, AuthResult, LoginCredentials } from './ports/index.js';
export type { CreateUserData, UserManagementPort } from './ports/index.js';

// Use Cases
export { GetCurrentUserUseCase, LoginUseCase, LogoutUseCase } from './use-cases/index.js';
export {
  AssignPolicyUseCase,
  CreateUserUseCase,
  ListUsersUseCase,
  RemovePolicyUseCase,
  UpdateUserRoleUseCase,
} from './use-cases/index.js';
export type { CreateUserResult } from './use-cases/index.js';
