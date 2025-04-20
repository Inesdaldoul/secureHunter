// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SecurityAuditService } from '../services/security-audit.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private securityAudit: SecurityAuditService
  ) {}

  canActivate(): boolean {
    if (!this.auth.currentSessionId) {
      this.securityAudit.logSecurityIncident({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'HIGH',
        context: { location: window.location.href }
      });
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}