import { Injectable, Injector } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SecurityAuditService } from './security-audit.service';
import { UniversalConnector } from '../connectors/universal-connector.service';
import { ErrorHandlerService } from './error-handler.service';
import { FeatureToggleService } from './../config/feature-toggles';

@Injectable({ providedIn: 'root' })
export class SecurityInterceptor implements HttpInterceptor {
  private isTokenRefreshInProgress = false;
  isAuthError: any;
  extractErrorDetails: any;

  constructor(
    private injector: Injector,
    private featureToggle: FeatureToggleService,
    private errorHandler: ErrorHandlerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const auditService = this.injector.get(SecurityAuditService);
    const connector = this.injector.get(UniversalConnector);

    // Apply security headers
    let secureReq = this.applySecurityHeaders(req);
    
    // Add microservice authentication
    secureReq = this.addServiceAuth(secureReq);

    return next.handle(secureReq).pipe(
      catchError(error => {
        // Handle session expiration
        if (this.isAuthError(error)) {
          return this.handleAuthError(error, secureReq, next);
        }
        
        // Log security incidents
        auditService.logSecurityIncident({
          type: 'HTTP_ERROR',
          severity: 'HIGH',
          details: this.extractErrorDetails(error)
        });

        return throwError(() => this.errorHandler.processHttpError(error));
      })
    );
  }

  private applySecurityHeaders(req: HttpRequest<any>): HttpRequest<any> {
    const headers = req.headers
      .set('Content-Security-Policy', this.featureToggle.getCSPPolicy())
      .set('X-Content-Type-Options', 'nosniff')
      .set('X-Frame-Options', 'DENY')
      .set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    if (this.featureToggle.isEnabled('ENCRYPTED_PAYLOADS')) {
      headers.set('X-Payload-Encryption', 'AES256-GCM');
    }

    return req.clone({ headers });
  }

  private addServiceAuth(req: HttpRequest<any>): HttpRequest<any> {
    const serviceType = this.getServiceTypeFromUrl(req.url);
    const token = this.getServiceToken(serviceType);
    
    return token ? 
      req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) :
      req;
  }
  getServiceToken(serviceType: string) {
    throw new Error('Method not implemented.');
  }

  private handleAuthError(error: HttpErrorResponse, req: HttpRequest<any>, next: HttpHandler) {
    if (!this.isTokenRefreshInProgress) {
      this.isTokenRefreshInProgress = true;
      const connector = this.injector.get(UniversalConnector);
      
      return connector.refreshAuthToken().pipe(
        switchMap(() => {
          this.isTokenRefreshInProgress = false;
          return next.handle(this.addServiceAuth(req));
        }),
        catchError(refreshError => {
          this.isTokenRefreshInProgress = false;
          this.errorHandler.handleCriticalError(refreshError);
          return throwError(() => refreshError);
        })
      );
    }
    return throwError(() => error);
  }

  private getServiceTypeFromUrl(url: string): string {
    const servicePatterns = {
      vi: /\/api\/vi\//,
      cti: /\/api\/cti\//,
      asm: /\/api\/asm\//,
      soar: /\/api\/soar\//
    };

    return Object.entries(servicePatterns)
      .find(([_, pattern]) => pattern.test(url))?.[0] || 'unknown';
  }
}