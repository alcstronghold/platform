import type { RpgSessionSummary } from '../../entities/rpg-session.entity.js';
import type { RpgSessionFilter, RpgSessionPort } from '../../ports/rpg-session.port.js';

export class ListSessionsUseCase {
  constructor(private readonly port: RpgSessionPort) {}

  async execute(filter?: RpgSessionFilter): Promise<RpgSessionSummary[]> {
    return this.port.listSessions(filter);
  }
}
