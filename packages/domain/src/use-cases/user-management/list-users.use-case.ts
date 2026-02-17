import type { ManagedUser } from '../../entities/managed-user.entity.js';
import type { UserManagementPort } from '../../ports/user-management.port.js';

export class ListUsersUseCase {
  constructor(private readonly port: UserManagementPort) {}

  async execute(): Promise<ManagedUser[]> {
    return this.port.listUsers();
  }
}
