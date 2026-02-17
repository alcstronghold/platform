import type { UserManagementPort } from '../../ports/user-management.port.js';

export class RemovePolicyUseCase {
  constructor(private readonly port: UserManagementPort) {}

  async execute(assignmentId: string): Promise<void> {
    return this.port.removePolicy(assignmentId);
  }
}
