import type { UserManagementPort } from '../../ports/user-management.port.js';

export class UpdateUserRoleUseCase {
  constructor(private readonly port: UserManagementPort) {}

  async execute(userId: string, roleId: string): Promise<void> {
    return this.port.updateUserRole(userId, roleId);
  }
}
