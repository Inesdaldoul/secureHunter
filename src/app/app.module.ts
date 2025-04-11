// src/app/app.module.ts
import { NgModule, SecurityContext } from '@angular/core';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { RouterModule } from '@angular/router';

// Core services & guards
import { SecurityInterceptor } from './core/services/security-interceptor';
import { ThemeService } from './core/services/theme.service';
import { JwtGuard } from './core/guards/jwt.guard';
import { RoleGuard } from './core/guards/role.guard';
import { FeatureToggleService } from './core/services/feature-toggle.service';
import { SecurityAuditService } from './core/services/security-audit.service';
import { MLPredictorService } from '../shared/services/ml-predictor.service';

// Configuration
import { SESSION_CONFIG } from './core/config/audit-config';
import { environment } from '../environments/environment';

// Components
import { AppComponent } from './app.component';
import { SecurityHeaderComponent } from './core/layout/security-header/security-header.component';
import { DynamicSidebarComponent } from './core/layout/dynamic-sidebar/dynamic-sidebar.component';
import { SecurityFooterComponent } from './core/layout/security-footer/security-footer.component';

@NgModule({
  declarations: [
    AppComponent,
    SecurityHeaderComponent,
    DynamicSidebarComponent,
    SecurityFooterComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatButtonModule,
    LeafletModule,
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
    MLPredictorService,
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: SecurityInterceptor, 
      multi: true 
    },
    JwtGuard,
    RoleGuard,
    {
      provide: DomSanitizer,
      useValue: {
        sanitize: (ctx: SecurityContext, value: string) => value
      }
    }
  ],
  bootstrap: [AppComponent]ml-predictor.service.ts
})
export class AppModule { }