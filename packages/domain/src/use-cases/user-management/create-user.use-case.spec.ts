import { describe, expect, it, vi } from 'vitest';

import type { ManagedUser } from '../../entities/managed-user.entity.js';
import type { CreateUserData, UserManagementPort } from '../../ports/user-management.port.js';
import { CreateUserUseCase } from './create-user.use-case.js';

function createMockPort(): UserManagementPort {
  return {
    listUsers: vi.fn(),
    createUser: vi.fn(),
    updateUserRole: vi.fn(),
    listRoles: vi.fn(),
    listPolicies: vi.fn(),
    getUserPolicyAssignments: vi.fn(),
    assignPolicy: vi.fn(),
    removePolicy: vi.fn(),
    updateUserStatus: vi.fn(),
  };
}

const validData: CreateUserData = {
  email: 'new@example.com',
  password: 'securepass123',
  firstName: 'New',
  lastName: 'User',
  roleId: 'role-1',
};

const mockManagedUser: ManagedUser = {
  id: 'user-1',
  email: 'new@example.com',
  firstName: 'New',
  lastName: 'User',
  avatar: null,
  status: 'active',
  role: { id: 'role-1', name: 'Member' },
  policyAssignments: [],
};

describe('CreateUserUseCase', () => {
  it('should create user with valid data', async () => {
    const port = createMockPort();
    vi.mocked(port.createUser).mockResolvedValue(mockManagedUser);
    const useCase = new CreateUserUseCase(port);

    const result = await useCase.execute(validData);

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockManagedUser);
    expect(port.createUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'securepass123',
      firstName: 'New',
      lastName: 'User',
      roleId: 'role-1',
    });
  });

  it('should normalize email to lowercase and trim', async () => {
    const port = createMockPort();
    vi.mocked(port.createUser).mockResolvedValue(mockManagedUser);
    const useCase = new CreateUserUseCase(port);

    await useCase.execute({ ...validData, email: '  NEW@Example.COM  ' });

    expect(port.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.com' }),
    );
  });

  it('should reject invalid email', async () => {
    const port = createMockPort();
    const useCase = new CreateUserUseCase(port);

    const result = await useCase.execute({ ...validData, email: 'not-an-email' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(port.createUser).not.toHaveBeenCalled();
  });

  it('should reject empty email', async () => {
    const port = createMockPort();
    const useCase = new CreateUserUseCase(port);

    const result = await useCase.execute({ ...validData, email: '' });

    expect(result.success).toBe(false);
    expect(port.createUser).not.toHaveBeenCalled();
  });

  it('should reject password shorter than 8 characters', async () => {
    const port = createMockPort();
    const useCase = new CreateUserUseCase(port);

    const result = await useCase.execute({ ...validData, password: 'short' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(port.createUser).not.toHaveBeenCalled();
  });

  it('should reject empty firstName', async () => {
    const port = createMockPort();
    const useCase = new CreateUserUseCase(port);

    const result = await useCase.execute({ ...validData, firstName: '' });

    expect(result.success).toBe(false);
    expect(port.createUser).not.toHaveBeenCalled();
  });

  it('should reject empty lastName', async () => {
    const port = createMockPort();
    const useCase = new CreateUserUseCase(port);

    const result = await useCase.execute({ ...validData, lastName: '' });

    expect(result.success).toBe(false);
    expect(port.createUser).not.toHaveBeenCalled();
  });

  it('should reject empty roleId', async () => {
    const port = createMockPort();
    const useCase = new CreateUserUseCase(port);

    const result = await useCase.execute({ ...validData, roleId: '' });

    expect(result.success).toBe(false);
    expect(port.createUser).not.toHaveBeenCalled();
  });

  it('should return error when port throws', async () => {
    const port = createMockPort();
    vi.mocked(port.createUser).mockRejectedValue(new Error('Directus error'));
    const useCase = new CreateUserUseCase(port);

    const result = await useCase.execute(validData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Directus error');
  });
});
