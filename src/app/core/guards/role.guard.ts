import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { SecurityAuditService } from '../services/security-audit.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { UniversalConnector } from '../connectors/universal-connector.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private auditService: SecurityAuditService,
    private connector: UniversalConnector,
    private errorHandler: ErrorHandlerService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRoles = this.getRequiredRoles(next);
    const userRoles = this.getUserRoles();

    if (!requiredRoles.length) return of(true);

    const hasAccess = requiredRoles.some(role => 
      userRoles.includes(role) ||
      this.checkDynamicPermissions(role, state.url)
    );

    if (!hasAccess) {
      this.handleAccessDenied(state.url, requiredRoles, userRoles);
    }

    return of(hasAccess);
  }

  private getRequiredRoles(route: ActivatedRouteSnapshot): string[] {
    return route.data['roles'] || 
           route.parent?.data['roles'] || 
           [];
  }

  private getUserRoles(): string[] {
    try {
      const session = this.connector.getActiveSession();
      return session?.user?.roles?.map((r: { name: string }) => r.name) || [];
    } catch (e) {
      this.errorHandler.handleError(e);
      return [];
    }
  }

  private checkDynamicPermissions(role: string, url: string): boolean {
    const context = {
      url,
      time: Date.now(),
      riskLevel: this.auditService.getCurrentThreatLevel()
    };
    
    return this.auditService.evaluateAccessPolicy(
      role, 
      'ROUTE_ACCESS', 
      context
    );
  }

  private handleAccessDenied(
    attemptedUrl: string,
    requiredRoles: string[],
    userRoles: string[]
  ): void {
    this.auditService.logSecurityIncident({
      type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'HIGH',
      details: {
        attemptedUrl,
        requiredRoles,
        userRoles,
        session: this.auditService.getSessionMetadata()
      }
    });

    this.router.navigate(['/error/403'], {
      skipLocationChange: true,
      state: {
        errorContext: {
          timestamp: Date.now(),
          resource: attemptedUrl,
          requiredRoles,
          userRoles
        }
      }
    });
  }
}