import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SplashLoaderComponent } from './splash-loader.component';

describe('SplashLoaderComponent', () => {
  let component: SplashLoaderComponent;
  let fixture: ComponentFixture<SplashLoaderComponent>;

  it('should create', () => {
    fixture = TestBed.createComponent(SplashLoaderComponent);
    component = fixture.componentInstance;

    expect(component).toBeDefined();
  });

  it('should render spinner with loading message', () => {
    fixture = TestBed.createComponent(SplashLoaderComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusElement = compiled.querySelector('[role="status"]');
    const srOnlyText = compiled.querySelector('.sr-only')?.textContent;
    const loadingText = compiled.querySelector('p')?.textContent;

    expect(statusElement).toBeTruthy();
    expect(srOnlyText).toContain('Verificando sesión');
    expect(loadingText).toContain('Cargando');
  });

  it('should render spinner with correct Tailwind classes', () => {
    fixture = TestBed.createComponent(SplashLoaderComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.fixed.inset-0');
    const spinner = compiled.querySelector('svg.animate-spin');

    expect(container).toBeTruthy();
    expect(spinner).toBeTruthy();
  });

  it('should use Flowbite spinner styles', () => {
    fixture = TestBed.createComponent(SplashLoaderComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('svg');

    expect(svg?.classList.contains('animate-spin')).toBe(true);
    expect(svg?.classList.contains('fill-blue-600')).toBe(true);
  });
});
