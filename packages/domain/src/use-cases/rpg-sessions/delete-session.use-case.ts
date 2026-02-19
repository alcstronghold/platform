import type { RpgSessionPort } from '../../ports/rpg-session.port.js';

export class DeleteSessionUseCase {
  constructor(private readonly port: RpgSessionPort) {}

  async execute(id: string): Promise<void> {
    return this.port.deleteSession(id);
  }
}
