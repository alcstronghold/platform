/**
 * User entity - Core domain model for authenticated users
 */
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
}

/**
 * Authenticated user with computed display name
 */
export interface AuthenticatedUser extends User {
  displayName: string;
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
export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    ...user,
    displayName: computeDisplayName(user),
  };
}