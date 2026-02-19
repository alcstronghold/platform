/**
 * Estado de un usuario en el sistema
 */
export type UserStatus = 'active' | 'suspended';

/**
 * User entity - Core domain model for authenticated users
 */
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  status: UserStatus;
}

/**
 * Rol del usuario en Directus con nivel de acceso
 */
export interface UserRole {
  id: string;
  name: string;
  adminAccess: boolean;
}

/**
 * Authenticated user with computed display name
 */
export interface AuthenticatedUser extends User {
  displayName: string;
  role: UserRole | null;
  policies: string[];
}

/**
 * Compute display name from user data
 * Priority: "FirstName LastName" > "FirstName" > email username
 */
export function computeDisplayName(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.email.split('@')[0];
}

/**
 * Create an AuthenticatedUser from a User
 */
export function toAuthenticatedUser(
  user: User,
  role?: UserRole,
  policies?: string[],
): AuthenticatedUser {
  return {
    ...user,
    displayName: computeDisplayName(user),
    role: role ?? null,
    policies: policies ?? [],
  };
}