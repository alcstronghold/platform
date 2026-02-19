import type { AuthenticatedUser } from '@alcstronghold/domain';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let mockAuthService: { user: ReturnType<typeof signal<AuthenticatedUser | null>> };

  beforeEach(() => {
    mockAuthService = {
      user: signal<AuthenticatedUser | null>(null),
    };

    TestBed.configureTestingModule({
      providers: [
        PermissionService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(PermissionService);
  });

  describe('isAdmin', () => {
    it('should return true when user has adminAccess', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Admin',
        role: { id: 'r1', name: 'Administrator', adminAccess: true },
        policies: [],
      });

      expect(service.isAdmin()).toBe(true);
    });

    it('should return false when user has no adminAccess', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'user@test.com',
        firstName: 'User',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'User',
        role: { id: 'r2', name: 'User', adminAccess: false },
        policies: [],
      });

      expect(service.isAdmin()).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('isMaster', () => {
    it('should return true when user has Master policy', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'master@test.com',
        firstName: 'Master',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Master',
        role: null,
        policies: ['Member', 'Master'],
      });

      expect(service.isMaster()).toBe(true);
    });

    it('should return false when user lacks Master policy', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'member@test.com',
        firstName: 'Member',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Member',
        role: null,
        policies: ['Member'],
      });

      expect(service.isMaster()).toBe(false);
    });
  });

  describe('isComisionRol', () => {
    it('should return true when user has Comisión de Rol policy', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'comision@test.com',
        firstName: 'Comisión',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Comisión',
        role: null,
        policies: ['Member', 'Comisión de Rol'],
      });

      expect(service.isComisionRol()).toBe(true);
    });
  });

  describe('canAccessSessions', () => {
    it('should return true for admin', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Admin',
        role: { id: 'r1', name: 'Administrator', adminAccess: true },
        policies: [],
      });

      expect(service.canAccessSessions()).toBe(true);
    });

    it('should return true for master', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'master@test.com',
        firstName: 'Master',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Master',
        role: { id: 'r2', name: 'User', adminAccess: false },
        policies: ['Master'],
      });

      expect(service.canAccessSessions()).toBe(true);
    });

    it('should return true for comisión de rol', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'comision@test.com',
        firstName: 'Comisión',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Comisión',
        role: { id: 'r2', name: 'User', adminAccess: false },
        policies: ['Comisión de Rol'],
      });

      expect(service.canAccessSessions()).toBe(true);
    });

    it('should return false for regular member without relevant policies', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'member@test.com',
        firstName: 'Member',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Member',
        role: { id: 'r2', name: 'User', adminAccess: false },
        policies: ['Member'],
      });

      expect(service.canAccessSessions()).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(service.canAccessSessions()).toBe(false);
    });
  });

  describe('canViewAllSessions', () => {
    it('should return true for admin', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Admin',
        role: { id: 'r1', name: 'Administrator', adminAccess: true },
        policies: [],
      });

      expect(service.canViewAllSessions()).toBe(true);
    });

    it('should return true for comisión de rol', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'comision@test.com',
        firstName: 'Comisión',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Comisión',
        role: { id: 'r2', name: 'User', adminAccess: false },
        policies: ['Comisión de Rol'],
      });

      expect(service.canViewAllSessions()).toBe(true);
    });

    it('should return false for master only', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'master@test.com',
        firstName: 'Master',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Master',
        role: { id: 'r2', name: 'User', adminAccess: false },
        policies: ['Master'],
      });

      expect(service.canViewAllSessions()).toBe(false);
    });
  });

  describe('canCreateSessions', () => {
    it('should return true for master', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'master@test.com',
        firstName: 'Master',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Master',
        role: { id: 'r2', name: 'User', adminAccess: false },
        policies: ['Master'],
      });

      expect(service.canCreateSessions()).toBe(true);
    });

    it('should return false for member without master policy', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'member@test.com',
        firstName: 'Member',
        lastName: null,
        avatar: null,
        status: 'active',
        displayName: 'Member',
        role: { id: 'r2', name: 'User', adminAccess: false },
        policies: ['Member'],
      });

      expect(service.canCreateSessions()).toBe(false);
    });
  });
});
