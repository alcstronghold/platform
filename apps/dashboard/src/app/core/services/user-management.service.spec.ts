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
  };
}

const mockUser: ManagedUser = {
  id: 'u1',
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatar: null,
  role: { id: 'r1', name: 'Member' },
  policyAssignments: [],
};

const mockRole: Role = { id: 'r1', name: 'Member' };
const mockPolicy: Policy = { id: 'p1', name: 'base:content-reader', description: 'Read content' };

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
    it('should create user and reload list', async () => {
      vi.mocked(mockPort.createUser).mockResolvedValue(mockUser);
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);

      const result = await service.createUser({
        email: 'new@example.com',
        password: 'securepass1',
        firstName: 'New',
        lastName: 'User',
        roleId: 'r1',
      });

      expect(result.success).toBe(true);
      expect(mockPort.listUsers).toHaveBeenCalled();
    });
  });

  describe('updateUserRole', () => {
    it('should update role and reload list', async () => {
      vi.mocked(mockPort.updateUserRole).mockResolvedValue();
      vi.mocked(mockPort.listUsers).mockResolvedValue([mockUser]);

      await service.updateUserRole('u1', 'r2');

      expect(mockPort.updateUserRole).toHaveBeenCalledWith('u1', 'r2');
      expect(mockPort.listUsers).toHaveBeenCalled();
    });
  });

  describe('assignPolicy', () => {
    it('should assign policy and return assignment', async () => {
      const assignment: PolicyAssignment = {
        id: 'a1', userId: 'u1', policyId: 'p1', policyName: 'base:content-reader',
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
});
