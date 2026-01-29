import type { AuthPort, AuthResult, LoginCredentials } from '../../ports';
import { LoginCredentialsSchema } from '../../ports';

/**
 * Login Use Case
 * Validates credentials using Zod schema and delegates to auth port
 */
export class LoginUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(credentials: LoginCredentials): Promise<AuthResult> {
    // Validate credentials with Zod schema
    const result = LoginCredentialsSchema.safeParse(credentials);

    if (!result.success) {
      // Return first validation error
      const firstError = result.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Error de validación',
      };
    }

    // Delegate to auth port with validated and normalized data
    return this.authPort.login(result.data);
  }
}
