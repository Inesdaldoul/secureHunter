// src/app/core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { SecurityAuditService } from '../services/security-audit.service';
import { UniversalConnector } from '../connectors/universal-connector.service';
import { ErrorHandlerService } from '../services/error-handler.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private connector: UniversalConnector,
    private auditService: SecurityAuditService,
    private errorHandler: ErrorHandlerService,
    private router: Router
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    try {
      const requiredRole = route.data['requiredRole'];
      const session = this.connector.getActiveSession();
      
      // Add null check to prevent "session is possibly null" error
      if (!session || !session.isValid) {
        this.handleUnauthorized();
        return false;
      }
      
      // Simplified role check logic
      const hasAccess = this.checkRoleAccess(requiredRole);
      
      if (!hasAccess) {
        this.auditService.logSecurityIncident({
          eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          severity: 'HIGH',
          context: {
            requiredRole,
            attemptedRoute: route.routeConfig?.path,
            riskLevel: this.auditService.getCurrentThreatLevel()
          }
        });
        
        // Redirect to unauthorized page
        this.router.navigate(['/unauthorized']);
        return false;
      }
      
      return true;
    } catch (e) {
      this.errorHandler.handleError(e as Error);
      return false;
    }
  }
  
  private checkRoleAccess(requiredRole: string): boolean {
    const session = this.connector.getActiveSession();
    
    // In a real implementation, you would check if the user has the required role
    // This is a simplified example
    return this.auditService.evaluateAccessPolicy({
      role: requiredRole,
      session: this.auditService.getSessionMetadata()
    });
  }
  
  private handleUnauthorized(): void {
    this.connector.clearSession();
    this.router.navigate(['/login']);
  }
}