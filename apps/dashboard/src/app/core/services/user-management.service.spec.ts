import type { ManagedUser, Policy, PolicyAssignment, Role, UserManagementPort } from '@alcstronghold/domain';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { USER_MANAGEMENT_PORT } from '../providers/directus.provider';
import { UserManagementService } from './user-management.service';

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

const mockUser: ManagedUser = {
  id: 'u1',
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatar: null,
  status: 'active',
  role: { id: 'r1', name: 'User' },
  policyAssignments: [],
};

const mockRole: Role = { id: 'r1', name: 'User' };
const mockPolicy: Policy = { id: 'p1', name: 'Member', description: 'Socio de la asociación' };

describe('UserManagementService', () => {
  let service: UserManagementService;
  let mockPort: UserManagementPort;

  beforeEach(() => {
    mockPort = createMockPort();

    TestBed.configureTestingModule({
      providers: [
        UserManagementService,
        { provide: USER_MANAGEMENT_PORT, useValue: mockPort },
      ],
    });

    service = TestBed.inject(UserManagementService);
  });

  describe('loadUsers', () => {
    it('should load users and update signal', async () => {
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);

      await service.loadUsers();

      expect(service.users()).toEqual([mockUser]);
      expect(service.isLoading()).toBe(false);
    });

    it('should set error on failure', async () => {
      vi.mocked(mockPort.listUsers).mockRejectedValue(new Error('Network error'));

      await service.loadUsers();

      expect(service.users()).toEqual([]);
      expect(service.error()).toBe('Network error');
    });

    it('should set loading during operation', async () => {
      vi.mocked(mockPort.listUsers).mockImplementation(async () => {
        expect(service.isLoading()).toBe(true);
        return [mockUser];
      });

      await service.loadUsers();
    });
  });

  describe('loadRoles', () => {
    it('should load roles', async () => {
      vi.mocked(mockPort.listRoles).mockResolvedValue([mockRole]);

      await service.loadRoles();

      expect(service.roles()).toEqual([mockRole]);
    });
  });

  describe('loadPolicies', () => {
    it('should load policies', async () => {
      vi.mocked(mockPort.listPolicies).mockResolvedValue([mockPolicy]);

      await service.loadPolicies();

      expect(service.policies()).toEqual([mockPolicy]);
    });
  });

  describe('createUser', () => {
    it('should resolve User role and create user', async () => {
      vi.mocked(mockPort.listRoles).mockResolvedValue([mockRole]);
      vi.mocked(mockPort.createUser).mockResolvedValue(mockUser);
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);

      const result = await service.createUser({
        email: 'new@example.com',
        password: 'securepass1',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.success).toBe(true);
      expect(mockPort.createUser).toHaveBeenCalledWith(expect.objectContaining({
        roleId: 'r1',
      }));
      expect(mockPort.listUsers).toHaveBeenCalled();
    });

    it('should fail if User role is not found', async () => {
      vi.mocked(mockPort.listRoles).mockResolvedValue([]);

      const result = await service.createUser({
        email: 'new@example.com',
        password: 'securepass1',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('User');
    });
  });

  describe('assignPolicy', () => {
    it('should assign policy and reload users', async () => {
      const assignment: PolicyAssignment = {
        id: 'a1', userId: 'u1', policyId: 'p1', policyName: 'Member',
      };
      vi.mocked(mockPort.assignPolicy).mockResolvedValue(assignment);
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);

      await service.assignPolicy('u1', 'p1');

      expect(mockPort.assignPolicy).toHaveBeenCalledWith('u1', 'p1');
    });
  });

  describe('removePolicy', () => {
    it('should remove policy assignment', async () => {
      vi.mocked(mockPort.removePolicy).mockResolvedValue();
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);

      await service.removePolicy('a1');

      expect(mockPort.removePolicy).toHaveBeenCalledWith('a1');
    });
  });

  describe('assignPolicies', () => {
    it('should assign multiple policies and reload users once', async () => {
      const assignment: PolicyAssignment = {
        id: 'a1', userId: 'u1', policyId: 'p1', policyName: 'Member',
      };
      vi.mocked(mockPort.assignPolicy).mockResolvedValue(assignment);
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);

      await service.assignPolicies('u1', ['p1', 'p2', 'p3']);

      expect(mockPort.assignPolicy).toHaveBeenCalledTimes(3);
      expect(mockPort.assignPolicy).toHaveBeenCalledWith('u1', 'p1');
      expect(mockPort.assignPolicy).toHaveBeenCalledWith('u1', 'p2');
      expect(mockPort.assignPolicy).toHaveBeenCalledWith('u1', 'p3');
      expect(mockPort.listUsers).toHaveBeenCalledTimes(1);
    });

    it('should not reload users when no policies provided', async () => {
      await service.assignPolicies('u1', []);

      expect(mockPort.assignPolicy).not.toHaveBeenCalled();
      expect(mockPort.listUsers).not.toHaveBeenCalled();
    });
  });

  describe('toggleUserStatus', () => {
    it('should suspend an active user', async () => {
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);
      vi.mocked(mockPort.updateUserStatus).mockResolvedValue();
      await service.loadUsers();

      await service.toggleUserStatus('u1');

      expect(mockPort.updateUserStatus).toHaveBeenCalledWith('u1', 'suspended');
    });

    it('should reactivate a suspended user', async () => {
      const suspendedUser = { ...mockUser, status: 'suspended' as const };
      vi.mocked(mockPort.listUsers).mockResolvedValue([suspendedUser]);
      vi.mocked(mockPort.updateUserStatus).mockResolvedValue();
      await service.loadUsers();

      await service.toggleUserStatus('u1');

      expect(mockPort.updateUserStatus).toHaveBeenCalledWith('u1', 'active');
    });

    it('should reload users after status change', async () => {
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);
      vi.mocked(mockPort.updateUserStatus).mockResolvedValue();
      await service.loadUsers();

      await service.toggleUserStatus('u1');

      // 1 carga inicial + 1 recarga después del toggle
      expect(mockPort.listUsers).toHaveBeenCalledTimes(2);
    });

    it('should do nothing if user not found', async () => {
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);
      await service.loadUsers();

      await service.toggleUserStatus('unknown-id');

      expect(mockPort.updateUserStatus).not.toHaveBeenCalled();
    });
  });
});
