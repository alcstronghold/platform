import type { AuthenticatedUser } from '@alcstronghold/domain';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { AppLayoutComponent } from './app-layout.component';

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;
  let mockAuthService: {
    user: ReturnType<typeof signal<AuthenticatedUser | null>>;
    logout: ReturnType<typeof vi.fn>;
  };
  let mockThemeService: {
    theme: ReturnType<typeof signal<string>>;
    isDark: ReturnType<typeof signal<boolean>>;
    toggle: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    mockAuthService = {
      user: signal<AuthenticatedUser | null>(null),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    mockThemeService = {
      theme: signal('system'),
      isDark: signal(false),
      toggle: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should render logo and title', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const logo = compiled.querySelector('img[alt="ALC Stronghold"]');
      expect(logo).toBeTruthy();
      expect(compiled.textContent).toContain('Dashboard');
    });

    it('should always show Dashboard link', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Dashboard');
    });
  });

  describe('admin navigation', () => {
    it('should show Usuarios link when user is admin', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        avatar: null,
        status: 'active',
        displayName: 'Admin User',
        role: { id: 'r1', name: 'Administrator', adminAccess: true },
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Usuarios');
    });

    it('should hide Usuarios link when user is not admin', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'user@test.com',
        firstName: 'Regular',
        lastName: 'User',
        avatar: null,
        status: 'active',
        displayName: 'Regular User',
        role: { id: 'r2', name: 'Member', adminAccess: false },
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const navLinks = compiled.querySelectorAll('nav a');
      const hasUsuarios = Array.from(navLinks).some((a) =>
        a.textContent?.includes('Usuarios'),
      );
      expect(hasUsuarios).toBe(false);
    });
  });

  describe('user info', () => {
    it('should display user displayName', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'test@test.com',
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
    });
  });

  describe('theme toggle', () => {
    it('should call themeService.toggle when button is clicked', () => {
      mockAuthService.user.set({
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        status: 'active',
        displayName: 'Test User',
        role: null,
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const themeButton = compiled.querySelector(
        '[data-testid="theme-toggle"]',
      ) as HTMLButtonElement;
      themeButton?.click();

      expect(mockThemeService.toggle).toHaveBeenCalledOnce();
    });
  });

  describe('logout', () => {
    it('should call authService.logout and navigate to login', async () => {
      mockAuthService.user.set({
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        status: 'active',
        displayName: 'Test User',
        role: null,
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const logoutButton = compiled.querySelector(
        '[data-testid="logout-button"]',
      ) as HTMLButtonElement;
      logoutButton?.click();
      await fixture.whenStable();

      expect(mockAuthService.logout).toHaveBeenCalledOnce();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
