import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../services/auth.service';
import { loginGuard } from './login.guard';

describe('loginGuard', () => {
  let mockAuthService: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
  };
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: signal(false),
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

  it('should allow access to login when user is NOT authenticated', () => {
    mockAuthService.isAuthenticated.set(false);

    const result = TestBed.runInInjectionContext(() =>
      loginGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when user is already authenticated', () => {
    mockAuthService.isAuthenticated.set(true);

    TestBed.runInInjectionContext(() =>
      loginGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
