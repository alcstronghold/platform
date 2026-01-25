import type { AuthenticatedUser } from '../../entities/user.entity';
import type { AuthPort } from '../../ports/auth.port';

/**
 * Get Current User Use Case
 * Returns the currently authenticated user or null
 */
export class GetCurrentUserUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(): Promise<AuthenticatedUser | null> {
    return this.authPort.getCurrentUser();
  }
}
