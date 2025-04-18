import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AbstractAdapter } from '../interfaces/adapter.interface';
import { ConnectionConfig } from '../interfaces/connection-config.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SecurityAuditService } from '../services/security-audit.service';
import { timeout, retry, map } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';

interface AsmSession {
  sessionToken: string;
  sessionId: string;
  baseUrl: string;
  expiration: number;
  endpoints: {
    assets: string;
    scans: string;
  };
}

interface AsmAuthResponse {
  token: string;
  session_id: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class AsmAdapter implements AbstractAdapter {
  private readonly SERVICE_TYPE = 'asm';
  private session: AsmSession | null = null;
  private readonly TIMEOUT = 25000;
  private readonly MAX_RETRIES = 3;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private securityAudit: SecurityAuditService
  ) {}

  async initialize(config: ConnectionConfig): Promise<AsmSession> {
    try {
      this.validateConfig(config);
      
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_INIT`,
        severity: 'MEDIUM',
        context: {
          endpoint: config.baseUrl,
          authType: config.authType
        },
        category: 'SYSTEM'
      });

      const response = await lastValueFrom(
        this.http.post<AsmAuthResponse>(
          `${config.baseUrl}/api/v2/sessions`,
          this.buildAuthPayload(config),
          { headers: this.getAuthHeaders(config) }
        ).pipe(
          timeout(this.TIMEOUT),
          retry(this.MAX_RETRIES),
          map(res => {
            if (!res.token || !res.session_id) {
              throw new Error('Invalid ASM response structure');
            }
            return res;
          })
        )
      );

      this.session = this.normalizeSession(config, response);
      
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_SUCCESS`,
        severity: 'LOW',
        context: {},
        category: 'SYSTEM'
      });

      return this.session;

    } catch (error) {
      this.handleError(error as Error, config);
      throw error;
    }
  }

  async terminate(connection: AsmSession): Promise<void> {
    try {
      await lastValueFrom(
        this.http.delete(
          `${connection.baseUrl}/api/v2/sessions/${connection.sessionId}`,
          { 
            headers: new HttpHeaders({
              'Authorization': `ASM ${connection.sessionToken}`
            })
          }
        )
      );
      
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_CLOSED`,
        severity: 'LOW',
        context: {},
        category: 'SYSTEM'
      });

    } catch (error) {
      const errorContext = {
        service: this.SERVICE_TYPE,
        endpoint: connection.baseUrl,
        sessionId: connection.sessionId
      };
      
      this.securityAudit.logError({
        eventType: `${this.SERVICE_TYPE}_ERROR`,
        severity: 'HIGH',
        context: errorContext,
        error: error as Error
      });
      
      this.errorHandler.handleError({
        error: error as Error,
        ...errorContext,
        category: 'TERMINATION'
      });
    } finally {
      this.session = null;
    }
  }

  validateConfig(config: ConnectionConfig): boolean {
    const requiredFields: (keyof ConnectionConfig['credentials'])[] = ['accountId', 'apiKey'];
    const missing = requiredFields.filter(f => !config.credentials[f]);
    
    if (missing.length > 0) {
      const error = new Error(`Configuration ${this.SERVICE_TYPE} manquante : ${missing.join(', ')}`);
      
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONFIG_ERROR`,
        severity: 'HIGH',
        context: {
          missingFields: missing,
          authType: config.authType
        },
        category: 'SYSTEM'
      });

      throw error;
    }
    return true;
  }

  private buildAuthPayload(config: ConnectionConfig): Record<string, string> {
    return {
      account_id: config.credentials.accountId as string,
      api_key: config.credentials.apiKey as string,
      scope: 'assets:read scan:execute'
    };
  }

  private getAuthHeaders(config: ConnectionConfig): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-ASM-Client': 'SecureHunter/2.0'
    });
  }

  private normalizeSession(config: ConnectionConfig, response: AsmAuthResponse): AsmSession {
    return {
      sessionToken: response.token,
      sessionId: response.session_id,
      baseUrl: config.baseUrl,
      expiration: Date.now() + (response.expires_in * 1000),
      endpoints: {
        assets: `${config.baseUrl}/api/v2/assets`,
        scans: `${config.baseUrl}/api/v2/scans`
      }
    };
  }

  private handleError(error: Error, config: ConnectionConfig): void {
    const errorContext = {
      service: this.SERVICE_TYPE,
      endpoint: config.baseUrl,
      authType: config.authType
    };

    this.securityAudit.logError({
      eventType: `${this.SERVICE_TYPE}_ERROR`,
      severity: 'HIGH',
      context: errorContext,
      error
    });
    
    this.errorHandler.handleError({
      error,
      ...errorContext,
      category: 'CONNECTION'
    });
  }
}