// cti-dashboard.route.ts
import { Routes } from '@angular/router';
import { JwtGuard, RoleGuard } from '../../../core/guards';
import { ThreatMapComponent, IntelFeedComponent } from './components';

export const CTI_ROUTES: Routes = [
  {
    path: 'cti',
    canActivate: [JwtGuard, RoleGuard],
    data: { 
      roles: ['THREAT_ANALYST', 'SOC_MANAGER'],
      featureFlag: 'CTI_DASHBOARD'
    },
    children: [
      { 
        path: 'map', 
        component: ThreatMapComponent,
        data: { 
          securityPolicy: 'high',
          cspRules: ['connect-src https://*.cartocdn.com']
        }
      },
      { 
        path: 'feed', 
        component: IntelFeedComponent,
        data: {
          securityPolicy: 'medium'
        }
      }
    ]
  }
];