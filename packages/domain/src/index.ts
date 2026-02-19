// Entities
export type { AuthenticatedUser, User, UserRole, UserStatus } from './entities/index.js';
export type { ManagedUser } from './entities/index.js';
export type { Role } from './entities/index.js';
export type { Policy, PolicyAssignment } from './entities/index.js';
export { computeDisplayName, toAuthenticatedUser } from './entities/index.js';

export type {
  CatalogItem,
  GenreCatalog,
  RpgEditionCatalog,
  RpgFamilyCatalog,
  RpgSystemCatalog,
  SettingCatalog,
} from './entities/index.js';

export type {
  CreateRpgSessionData,
  RpgSessionDetail,
  RpgSessionStatus,
  RpgSessionSummary,
  UpdateRpgSessionData,
} from './entities/index.js';

// Ports
export type { AuthPort, AuthResult, LoginCredentials } from './ports/index.js';
export type { CreateUserData, UserManagementPort } from './ports/index.js';
export type { CatalogPort } from './ports/index.js';
export type { RpgSessionFilter, RpgSessionPort } from './ports/index.js';

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

export {
  CreateSessionUseCase,
  DeleteSessionUseCase,
  GetSessionUseCase,
  ListSessionsUseCase,
  UpdateSessionUseCase,
} from './use-cases/index.js';
export type { CreateSessionResult, UpdateSessionResult } from './use-cases/index.js';
