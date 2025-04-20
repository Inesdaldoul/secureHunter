// src/app/core/guards/session.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UniversalConnector } from '../connectors/universal-connector.service';
import { SecurityAuditService } from '../services/security-audit.service';

@Injectable({
  providedIn: 'root'
})
export class SessionGuard implements CanActivate {
  constructor(
    private connector: UniversalConnector,
    private router: Router,
    private securityAudit: SecurityAuditService
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      const session = await this.connector.validateCurrentSession();
      if (!session.isValid) {
        this.handleInvalidSession();
        return false;
      }
      return true;
    } catch (error) {
      this.handleInvalidSession();
      return false;
    }
  }

  private handleInvalidSession(): void {
    this.securityAudit.logSecurityIncident({
      eventType: 'SESSION_TIMEOUT',
      severity: 'MEDIUM',
      context: { lastLocation: window.location.href }
    });
    this.connector.clearSession();
    this.router.navigate(['/login']);
  }
}