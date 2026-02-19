import type { AuthenticatedUser } from '@alcstronghold/domain';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthService } from '../../../core/services/auth.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: {
    user: ReturnType<typeof signal<AuthenticatedUser | null>>;
  };

  beforeEach(() => {
    mockAuthService = {
      user: signal<AuthenticatedUser | null>(null),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
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
        policies: [],
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
        status: 'active',
        displayName: 'Test User',
        role: null,
        policies: [],
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const img = compiled.querySelector('img') as HTMLImageElement | null;
      expect(img).toBeTruthy();
      expect(img?.getAttribute('alt')).toBe('Test User');
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
        policies: [],
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
        policies: [],
      });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('admin@alcstronghold.com');
    });
  });
});
