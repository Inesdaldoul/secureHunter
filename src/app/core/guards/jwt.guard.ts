import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, of, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { SecurityAuditService } from '../services/security-audit.service';
import { UniversalConnector } from '../connectors/universal-connector.service';
import { ErrorHandlerService } from '../services/error-handler.service';

@Injectable({ providedIn: 'root' })
export class JwtGuard implements CanActivate {
  constructor(
    private router: Router,
    private connector: UniversalConnector,
    private auditService: SecurityAuditService,
    private errorHandler: ErrorHandlerService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.validateToken().pipe(
      switchMap(isValid => {
        if (!isValid) {
          this.handleInvalidToken(state.url);
          return of(false);
        }
        return of(true);
      }),
      catchError(error => {
        this.errorHandler.handleError(error);
        this.router.navigate(['/critical-error']);
        return of(false);
      })
    );
  }

  private validateToken(): Observable<boolean> {
    return from(this.connector.validateCurrentSession().then(validation => {
      this.auditService.logSecurityEvent({
        type: 'SESSION_VALIDATION',
        severity: 'MEDIUM',
        details: { result: validation.status }
      });
      
      return validation.isValid && 
             !this.isTokenExpired(validation.expiration) &&
             this.checkTokenIntegrity(validation.token);
    }));
  }

  private isTokenExpired(expiration: number): boolean {
    return Date.now() >= expiration * 1000;
  }

  private checkTokenIntegrity(token: string): boolean {
    try {
      const [header, payload, signature] = token.split('.');
      return !!header && !!payload && !!signature;
    } catch (e) {
      return false;
    }
  }

  private handleInvalidToken(attemptedUrl: string): void {
    this.auditService.logSecurityIncident({
      type: 'INVALID_SESSION_ATTEMPT',
      severity: 'HIGH',
      details: {
        attemptedUrl,
        clientInfo: this.auditService.getClientMetadata()
      }
    });
    
    this.connector.disconnectAll();
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: attemptedUrl }
    });
  }
}