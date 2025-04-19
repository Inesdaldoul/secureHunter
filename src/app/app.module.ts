// src/app/app.module.ts
import { NgModule, SecurityContext } from '@angular/core';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SecurityInterceptor } from './core/services/security-interceptor';
import { ThemeService } from './core/services/theme.service';
import { JwtGuard } from './core/guards/jwt.guard';
import { RoleGuard } from './core/guards/role.guard';
import { FeatureToggleService } from './core/config/feature-toggles';
import { SecurityAuditService } from './core/services/security-audit.service';
import { MlPredictorService } from './core/services/ml-predictor.service';

import { SESSION_CONFIG } from './core/config/audit-config';
import { environment } from '../environments/environment';

// Use bootstrapApplication approach for standalone components
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: SESSION_CONFIG, useValue: { bufferSize: 25 } },
    ThemeService,
    FeatureToggleService,
    SecurityAuditService,
    MlPredictorService,
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    JwtGuard,
    RoleGuard,
    {
      provide: DomSanitizer,
      useValue: { sanitize: (ctx: SecurityContext, value: string) => value }
    },
    provideRouter([]),
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      HttpClientModule,
      MatIconModule,
      MatButtonModule
    )
  ]
});

// Keep an empty NgModule for any non-standalone components if needed
@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatButtonModule,
    RouterModule.forRoot([], {
      enableTracing: environment.enableDebugTools,
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    })
  ],
  providers: [
    { provide: SESSION_CONFIG, useValue: { bufferSize: 25 } },
    ThemeService,
    FeatureToggleService,
    SecurityAuditService,
    MlPredictorService,
    { provide: HTTP_INTERCEPTORS, useClass: SecurityInterceptor, multi: true },
    JwtGuard,
    RoleGuard,
    {
      provide: DomSanitizer,
      useValue: { sanitize: (ctx: SecurityContext, value: string) => value }
    }
  ]
})
export class AppModule {}