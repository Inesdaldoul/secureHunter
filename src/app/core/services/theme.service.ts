import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SecurityAuditService } from './security-audit.service';
import { FeatureToggleService } from '../config/feature-toggles';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme = new BehaviorSubject<string>('dark');
  private readonly THEME_KEY = 'securehunter_theme';

  constructor(
    rendererFactory: RendererFactory2,
    private auditService: SecurityAuditService,
    private featureToggle: FeatureToggleService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initTheme();
  }

  get theme$(): Observable<string> {
    return this.currentTheme.asObservable();
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    this.setTheme(savedTheme || 'dark');
  }

  setTheme(themeName: string): void {
    if (!this.isValidTheme(themeName)) return;

    this.renderer.removeClass(document.body, this.currentTheme.value);
    this.renderer.addClass(document.body, themeName);
    
    this.currentTheme.next(themeName);
    localStorage.setItem(this.THEME_KEY, themeName);
    
    this.auditService.log({
      eventType: 'THEME_CHANGE',
      severity: 'LOW',
      context: { 
        previous: this.currentTheme.value, 
        new: themeName 
      }
    });
  }

  private isValidTheme(theme: string): boolean {
    return ['dark', 'light', 'high-contrast'].includes(theme);
  }
}