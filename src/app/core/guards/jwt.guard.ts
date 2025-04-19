import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable, of, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { SecurityAuditService, AuditEvent } from '../services/security-audit.service';
import { UniversalConnector, SessionValidationResult } from '../connectors/universal-connector.service';
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
      catchError((error: Error) => {
        this.errorHandler.handleError(error);
        this.router.navigate(['/critical-error']);
        return of(false);
      })
    );
  }

  private validateToken(): Observable<boolean> {
    return from(this.connector.validateCurrentSession().then((validation: SessionValidationResult) => {
      this.auditService.logSecurityEvent({
        eventType: 'SESSION_VALIDATION',
        severity: 'MEDIUM',
        context: { 
          isValid: validation.isValid,
          expiration: validation.expiration
        }
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
    const tokenParts = token.split('.');
    return tokenParts.length === 3 && 
           tokenParts.every(part => part.length > 0);
  }

  private handleInvalidToken(attemptedUrl: string): void {
    this.auditService.logSecurityEvent({
      eventType: 'INVALID_SESSION_ATTEMPT',
      severity: 'HIGH',
      context: {
        attemptedUrl,
        clientInfo: this.auditService.getClientMetadata()
      }
    });
    
    this.connector.clearSession();
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: attemptedUrl }
    });
  }
}