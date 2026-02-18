import type { AuthenticatedUser } from '@alcstronghold/domain';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/services/auth.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: {
    user: ReturnType<typeof signal<AuthenticatedUser | null>>;
    logout: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = {
      user: signal<AuthenticatedUser | null>(null),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should render dashboard title', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('ALC Stronghold Dashboard');
      expect(compiled.textContent).toContain('Bienvenido al Dashboard');
    });
  });

  describe('user display', () => {
    it('should display user info when authenticated', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        status: 'active',
        displayName: 'Test User',
        role: null,
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Test User');
      expect(compiled.textContent).toContain('test@example.com');
    });

    it('should display user avatar when available', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: 'https://example.com/avatar.png',
        displayName: 'Test User',
        role: null,
      } as AuthenticatedUser);

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const img = compiled.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('alt')).toBe('Test User');
      // ngSrc se transforma en src después del rendering
      expect(img?.src).toBeTruthy();
    });

    it('should display initial letter when no avatar', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        status: 'active',
        displayName: 'Test User',
        role: null,
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const initial = compiled.querySelector('.rounded-full.bg-blue-600');
      expect(initial?.textContent?.trim()).toBe('T');
    });

    it('should display user email in profile section', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'admin@alcstronghold.com',
        firstName: 'Admin',
        lastName: 'User',
        avatar: null,
        status: 'active',
        displayName: 'Admin User',
        role: null,
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const profileSection = compiled.querySelector('main');
      expect(profileSection?.textContent).toContain('admin@alcstronghold.com');
    });

    it('should not display logout button when no user', () => {
      mockAuthService.user.set(null);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const logoutButton = compiled.querySelector('button');
      expect(logoutButton).toBeNull();
    });

    it('should display logout button when user is authenticated', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        status: 'active',
        displayName: 'Test User',
        role: null,
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const logoutButton = compiled.querySelector('button');
      expect(logoutButton).toBeTruthy();
      expect(logoutButton?.textContent).toContain('Cerrar sesión');
    });
  });

  describe('logout', () => {
    it('should call authService.logout and navigate to login', async () => {
      // @ts-expect-error - Accessing protected method for testing
      await component.onLogout();

      expect(mockAuthService.logout).toHaveBeenCalledOnce();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: {},
        queryParamsHandling: '',
      });
    });

    it('should clear query params when navigating to login', async () => {
      // @ts-expect-error - Accessing protected method for testing
      await component.onLogout();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: {},
        queryParamsHandling: '',
      });
    });

    it('should call logout and navigate in sequence', async () => {
      // AuthService.logout() siempre resuelve (nunca lanza error)
      // gracias al try-catch interno
      // @ts-expect-error - Accessing protected method for testing
      await component.onLogout();

      expect(mockAuthService.logout).toHaveBeenCalledOnce();
      expect(mockRouter.navigate).toHaveBeenCalledAfter(mockAuthService.logout);
    });

    it('should trigger logout when button is clicked', async () => {
      mockAuthService.user.set({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        status: 'active',
        displayName: 'Test User',
        role: null,
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const logoutButton = compiled.querySelector('button') as HTMLButtonElement;

      logoutButton.click();
      await fixture.whenStable();

      expect(mockAuthService.logout).toHaveBeenCalledOnce();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: {},
        queryParamsHandling: '',
      });
    });
  });
});
