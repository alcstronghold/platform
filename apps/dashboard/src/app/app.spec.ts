import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './app';
import { AuthService } from './core/services/auth.service';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let mockAuthService: {
    isLoading: ReturnType<typeof signal<boolean>>;
    user: ReturnType<typeof signal<null>>;
  };

  beforeEach(async () => {
    mockAuthService = {
      isLoading: signal(false),
      user: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
  });

  it('should create the app', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show splash loader when auth is initializing', () => {
    mockAuthService.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-splash-loader')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeNull();
  });

  it('should show router-outlet when auth completes', () => {
    mockAuthService.isLoading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-splash-loader')).toBeNull();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
