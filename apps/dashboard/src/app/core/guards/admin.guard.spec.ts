import type { AuthenticatedUser } from '@alcstronghold/domain';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, type RouterStateSnapshot, type ActivatedRouteSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let mockAuthService: { user: ReturnType<typeof signal<AuthenticatedUser | null>> };
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockAuthService = {
      user: signal<AuthenticatedUser | null>(null),
    };

    mockRouter = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when user has adminAccess', () => {
    mockAuthService.user.set({
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: null,
      avatar: null,
      displayName: 'Admin',
      role: { id: 'r1', name: 'Administrator', adminAccess: true },
    });

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when user is not admin', () => {
    mockAuthService.user.set({
      id: '1',
      email: 'member@example.com',
      firstName: 'Member',
      lastName: null,
      avatar: null,
      displayName: 'Member',
      role: { id: 'r2', name: 'Member', adminAccess: false },
    });

    TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should redirect when user has no role', () => {
    mockAuthService.user.set({
      id: '1',
      email: 'norole@example.com',
      firstName: 'NoRole',
      lastName: null,
      avatar: null,
      displayName: 'NoRole',
      role: null,
    });

    TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should redirect when user is null', () => {
    mockAuthService.user.set(null);

    TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
