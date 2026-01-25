import type { AuthenticatedUser } from '../entities';

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Result of an authentication operation
 */
export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Auth port - Interface for authentication operations
 * Implemented by infrastructure layer (e.g., DirectusAuthAdapter)
 */
export interface AuthPort {
  /**
   * Authenticate user with email and password
   */
  login(credentials: LoginCredentials): Promise<AuthResult>;

  /**
   * End the current session
   */
  logout(): Promise<void>;

  /**
   * Refresh the current session token
   */
  refreshToken(): Promise<AuthResult>;

  /**
   * Get the currently authenticated user, or null if not authenticated
   */
  getCurrentUser(): Promise<AuthenticatedUser | null>;
}
