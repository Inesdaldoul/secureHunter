import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpResponse 
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SecurityAuditService } from '../services/security-audit.service';
import { ErrorHandlerService } from '../services/error-handler.service';

@Injectable({ providedIn: 'root' })
export class ApiCacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, { 
    response: any, 
    timestamp: number, 
    metadata: any 
  }>();
  private readonly CACHE_TTL = 300000; // 5 minutes
  handleCacheError: any;

  constructor(
    private auditService: SecurityAuditService,
    private errorHandler: ErrorHandlerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isCacheable(req)) return next.handle(req);

    const cacheKey = this.createCacheKey(req);
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached.timestamp)) {
      this.auditService.logPerformanceEvent({
        type: 'CACHE_HIT',
        endpoint: req.url,
        latency: Date.now() - cached.timestamp
      });
      return of(new HttpResponse(cached.response));
    }

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cacheResponse(cacheKey, event, req);
        }
      }),
      catchError(error => {
        this.handleCacheError(error, req);
        return throwError(() => error);
      })
    );
  }

  private cacheResponse(key: string, response: HttpResponse<any>, req: HttpRequest<any>): void {
    const metadata = {
      headers: req.headers.keys(),
      securityLevel: this.getSecurityLevel(response.body),
      size: JSON.stringify(response.body).length
    };

    this.cache.set(key, {
      response: response.clone(),
      timestamp: Date.now(),
      metadata
    });

    this.auditService.logPerformanceEvent({
      type: 'CACHE_UPDATE',
      endpoint: req.url,
      size: metadata.size
    });
  }

  private getSecurityLevel(data: any): string {
    const sensitiveKeywords = ['token', 'password', 'secret'];
    return sensitiveKeywords.some(k => JSON.stringify(data).includes(k)) ? 
      'HIGH' : 'LOW';
  }

  invalidateCache(endpointPattern: RegExp): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (endpointPattern.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  private isCacheable(req: HttpRequest<any>): boolean {
    return req.method === 'GET' && 
           !req.headers.has('Authorization') &&
           !req.url.includes('/sensitive/');
  }

  private createCacheKey(req: HttpRequest<any>): string {
    return `${req.url}?${req.params.toString()}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_TTL;
  }
}