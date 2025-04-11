// soar-dashboard.route.ts
import { Routes } from '@angular/router';
import { JwtGuard, RoleGuard } from '../../../core/guards';
import { WorkflowOrchestratorComponent, IncidentFeedComponent } from './components';

export const SOAR_ROUTES: Routes = [
  {
    path: 'soar',
    canActivate: [JwtGuard, RoleGuard],
    data: { 
      roles: ['SOC_ANALYST', 'INCIDENT_RESPONDER'],
      featureFlag: 'SOAR_DASHBOARD'
    },
    children: [
      { 
        path: 'workflows', 
        component: WorkflowOrchestratorComponent,
        data: { securityLevel: 'high' }
      },
      { 
        path: 'incidents', 
        component: IncidentFeedComponent,
        data: { securityLevel: 'medium' }
      }
    ]
  }
];