// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SecurityInterceptor } from './app/core/services/security-interceptor';
import { ThemeService } from './app/core/services/theme.service';
import { JwtGuard } from './app/core/guards/jwt.guard';
import { RoleGuard } from './app/core/guards/role.guard';
import { FeatureToggleService } from './app/core/config/feature-toggles';
import { SecurityAuditService } from './app/core/services/security-audit.service';
import { MlPredictorService } from './app/core/services/ml-predictor.service';
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';
import { SESSION_CONFIG } from './app/core/config/audit-config';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideRouter([]),
    importProvidersFrom(HttpClientModule),
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
.catch(err => console.error(err));