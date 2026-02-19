import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PermissionService } from '../services/permission.service';
import { sessionsGuard } from './sessions.guard';

describe('sessionsGuard', () => {
  let mockPermissionService: { canAccessSessions: ReturnType<typeof signal<boolean>> };
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockPermissionService = {
      canAccessSessions: signal(false),
    };

    mockRouter = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PermissionService, useValue: mockPermissionService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when canAccessSessions is true', () => {
    mockPermissionService.canAccessSessions = signal(true);
    TestBed.overrideProvider(PermissionService, { useValue: mockPermissionService });

    const result = TestBed.runInInjectionContext(() =>
      sessionsGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when canAccessSessions is false', () => {
    TestBed.runInInjectionContext(() =>
      sessionsGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
