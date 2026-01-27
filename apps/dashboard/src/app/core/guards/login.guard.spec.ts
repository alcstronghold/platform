import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { loginGuard } from './login.guard';
import { AuthService } from '../services/auth.service';

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

    const result = TestBed.runInInjectionContext(() => loginGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when user is already authenticated', () => {
    mockAuthService.isAuthenticated.set(true);

    TestBed.runInInjectionContext(() => loginGuard({} as any, {} as any));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
