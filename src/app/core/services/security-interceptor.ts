// src/app/core/services/security-interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { UniversalConnector } from '../connectors/universal-connector.service';
import { ErrorHandlerService } from './error-handler.service';

// Since you don't have this service, let's implement a minimal version
@Injectable({ providedIn: 'root' })
class FeatureToggleService {
  getCSPPolicy(): string {
    return "default-src 'self'; script-src 'self'";
  }
}

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  
  constructor(
    private connector: UniversalConnector,
    private errorHandler: ErrorHandlerService,
    private featureToggle: FeatureToggleService
  ) {}
  
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add security headers
    request = this.addSecurityHeaders(request);
    
    // Add auth token if available
    request = this.addAuthToken(request);
    
    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        
        // Log other errors
        this.errorHandler.logSecurityEvent({
          eventType: 'HTTP_ERROR',
          severity: 'MEDIUM',
          context: {
            url: request.url,
            method: request.method,
            status: error.status,
            message: error.message
          }
        });
        
        return throwError(() => this.errorHandler.processHttpError(error));
      })
    );
  }
  
  private addSecurityHeaders(request: HttpRequest<any>): HttpRequest<any> {
    // Add security headers to the request
    return request.clone({
      setHeaders: {
        'Content-Security-Policy': this.featureToggle.getCSPPolicy(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });
  }
  
  private addAuthToken(request: HttpRequest<any>): HttpRequest<any> {
    // Get auth token
    const token = this.connector.getAuthToken();
    
    // Only add token if it exists and is not a request to an external domain
    if (token && this.isSameDomain(request.url)) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return request;
  }
  
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      
      return this.connector.refreshAuthToken().pipe(
        switchMap(token => {
          // Resume with new token
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          
          // Clone the original request with the new token
          return next.handle(this.addAuthToken(request));
        }),
        catchError(refreshError => {
          // If refresh fails, handle critical error
          this.isRefreshing = false;
          this.errorHandler.handleCriticalError(refreshError);
          return throwError(() => refreshError);
        })
      );
    } else {
      // Wait for the token refresh to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addAuthToken(request));
        })
      );
    }
  }
  
  private isSameDomain(url: string): boolean {
    // Check if URL is for same domain or is a relative URL
    if (url.startsWith('/')) {
      return true;
    }
    
    try {
      const requestUrl = new URL(url);
      const currentUrl = new URL(window.location.href);
      return requestUrl.hostname === currentUrl.hostname;
    } catch (e) {
      return false;
    }
  }
}