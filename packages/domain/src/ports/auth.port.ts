import { z } from 'zod';

import type { AuthenticatedUser } from '../entities';

/**
 * Login credentials schema with validation
 */
export const LoginCredentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El email es obligatorio')
    .email('El formato del email no es válido')
    .toLowerCase(),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

/**
 * Login credentials type (inferred from schema)
 */
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

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
