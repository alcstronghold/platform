import type { RpgSessionDetail } from '../../entities/rpg-session.entity.js';
import type { RpgSessionPort } from '../../ports/rpg-session.port.js';

export class GetSessionUseCase {
  constructor(private readonly port: RpgSessionPort) {}

  async execute(id: string): Promise<RpgSessionDetail | null> {
    return this.port.getSession(id);
  }
}
