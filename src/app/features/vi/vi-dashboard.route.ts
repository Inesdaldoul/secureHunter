// vi-dashboard.route.ts
import { Routes } from '@angular/router';
import { JwtGuard, RoleGuard } from '../../../core/guards';
import { VulnerabilityMapComponent, RiskTimelineComponent } from './components';

export const VI_ROUTES: Routes = [
  {
    path: 'vi',
    canActivate: [JwtGuard, RoleGuard],
    data: { 
      roles: ['VI_ANALYST', 'SOC_MANAGER'],
      featureFlag: 'VI_DASHBOARD'
    },
    children: [
      { 
        path: 'map', 
        component: VulnerabilityMapComponent,
        data: { 
          securityPolicy: 'high' 
        }
      },
      { 
        path: 'timeline', 
        component: RiskTimelineComponent,
        data: {
          securityPolicy: 'medium'
        }
      }
    ]
  }
];