import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let mockAuthService: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
  };
  let mockRouter: Partial<Router>;
  let mockRoute: Partial<ActivatedRouteSnapshot>;

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: signal(false),
    };

    mockRouter = {
      createUrlTree: vi.fn(),
    };

    mockRoute = {
      url: [],
      queryParams: {},
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should allow access when user is authenticated', () => {
    mockAuthService.isAuthenticated.set(true);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute as ActivatedRouteSnapshot, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect to /login when user is not authenticated', () => {
    mockAuthService.isAuthenticated.set(false);
    mockRoute.url = [{ path: 'dashboard' } as any];

    TestBed.runInInjectionContext(() => authGuard(mockRoute as ActivatedRouteSnapshot, {} as any));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { redirectUrl: '/dashboard' },
    });
  });

  it('should include query params in redirectUrl', () => {
    mockAuthService.isAuthenticated.set(false);
    mockRoute.url = [{ path: 'dashboard' } as any];
    mockRoute.queryParams = { tab: 'settings', id: '123' };

    TestBed.runInInjectionContext(() => authGuard(mockRoute as ActivatedRouteSnapshot, {} as any));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { redirectUrl: '/dashboard?tab=settings&id=123' },
    });
  });

  it('should handle nested routes in redirectUrl', () => {
    mockAuthService.isAuthenticated.set(false);
    mockRoute.url = [{ path: 'admin' } as any, { path: 'users' } as any, { path: 'edit' } as any];

    TestBed.runInInjectionContext(() => authGuard(mockRoute as ActivatedRouteSnapshot, {} as any));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { redirectUrl: '/admin/users/edit' },
    });
  });
});
