import type { PolicyAssignment } from '../../entities/policy.entity.js';
import type { UserManagementPort } from '../../ports/user-management.port.js';

export class AssignPolicyUseCase {
  constructor(private readonly port: UserManagementPort) {}

  async execute(userId: string, policyId: string): Promise<PolicyAssignment> {
    return this.port.assignPolicy(userId, policyId);
  }
}
