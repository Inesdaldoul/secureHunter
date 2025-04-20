// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DynamicSidebarComponent } from './core/components/dynamic-sidebar/dynamic-sidebar.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ThreatIntelligenceComponent } from './features/cti/threat-intelligence.component';
import { VulnerabilityManagementComponent } from './features/vi/vulnerability-management.component';
import { AssetSecurityComponent } from './features/asm/asset-security.component';
import { SoarOperationsComponent } from './features/soar/soar-operations.component';
import { AuthGuard } from './core/guards/auth.guard';
import { SessionGuard } from './core/guards/session.guard';

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
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Set to true for debugging routes
    useHash: environment.production // Hash-based routing for production
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }