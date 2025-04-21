// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TermsComponent } from './features/terms/terms.component';

// ✅ Correct imports based on updated file locations
import { DynamicSidebarComponent } from './core/layout/dynamic-sidebar/dynamic-sidebar.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ThreatIntelligenceComponent } from './features/cti/threat-intelligence/threat-intelligence.component';
import { VulnerabilityManagementComponent } from './features/vi/vulnerability-management/vulnerability-management.component';
import { AssetSecurityComponent } from './features/asm/asset-security/asset-security.component';
import { SoarOperationsComponent } from './features/soar/soar-operations/soar-operations.component';

import { AuthGuard } from './core/guards/auth.guard';
import { SessionGuard } from './core/guards/session.guard';

// ✅ If you're missing the environment.ts, temporarily replace with false or create the file
import { environment } from '../environments/environment';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, SessionGuard],
    children: [
      {
        path: '',
        component: DynamicSidebarComponent,
        outlet: 'sidebar'
      }
    ]
  },
  {
    path: 'cti',
    component: ThreatIntelligenceComponent,
    canActivate: [AuthGuard, SessionGuard],
    data: { serviceType: 'cti' }
  },
  {
    path: 'vi',
    component: VulnerabilityManagementComponent,
    canActivate: [AuthGuard, SessionGuard],
    data: { serviceType: 'vi' }
  },
  {
    path: 'asm',
    component: AssetSecurityComponent,
    canActivate: [AuthGuard, SessionGuard],
    data: { serviceType: 'asm' }
  },
  {
    path: 'soar',
    component: SoarOperationsComponent,
    canActivate: [AuthGuard, SessionGuard],
    data: { serviceType: 'soar' }
  },
  { path: 'terms', component: TermsComponent },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    useHash: environment.production // If you don't have `environment.ts`, set it manually for now
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
