// asm-dashboard.route.ts
import { Routes } from '@angular/router';
import { JwtGuard, RoleGuard } from '../../../core/guards';
import { AttackSurfaceViewComponent, ExposureAnalysisComponent } from './components';

export const ASM_ROUTES: Routes = [
  {
    path: 'asm',
    canActivate: [JwtGuard, RoleGuard],
    data: { 
      roles: ['SECURITY_ANALYST', 'RISK_MANAGER'],
      featureFlag: 'ASM_DASHBOARD'
    },
    children: [
      { 
        path: 'surface', 
        component: AttackSurfaceViewComponent,
        data: { securityLevel: 'high' }
      },
      { 
        path: 'exposure', 
        component: ExposureAnalysisComponent,
        data: { securityLevel: 'medium' }
      }
    ]
  }
];