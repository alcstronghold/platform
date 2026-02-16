import type { AuthPort } from '../../ports/index.js';

/**
 * Logout Use Case
 * Ends the current session
 */
export class LogoutUseCase {
  constructor(private readonly authPort: AuthPort) {}

  async execute(): Promise<void> {
    return this.authPort.logout();
  }
}
