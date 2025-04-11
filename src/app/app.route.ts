import { Routes } from '@angular/router';
import { JwtGuard } from './core/guards/jwt.guard';
import { RoleGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'vi',
    loadChildren: () => import('./features/vi/vi-dashboard.route').then(m => m.VI_ROUTES),
    canActivate: [JwtGuard, RoleGuard],
    data: { requiredRole: 'vulnerability-analyst' }
  },
  {
    path: 'cti',
    loadChildren: () => import('./features/cti/cti-dashboard.route').then(m => m.CTI_ROUTES),
    canActivate: [JwtGuard]
  },
  {
    path: 'asm',
    loadChildren: () => import('./features/asm/asm-dashboard.route').then(m => m.ASM_ROUTES),
    canActivate: [JwtGuard, RoleGuard],
    data: { requiredRole: 'attack-surface-manager' }
  },
  {
    path: 'soar',
    loadChildren: () => import('./features/soar/soar-dashboard.route').then(m => m.SOAR_ROUTES),
    canActivate: [JwtGuard, RoleGuard],
    data: { requiredRole: 'security-operator' }
  },
  { path: '**', redirectTo: 'vi', pathMatch: 'full' }
];