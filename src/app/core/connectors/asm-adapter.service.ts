import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AbstractAdapter } from '../interfaces/adapter.interface';
import { ConnectionConfig } from '../interfaces/connection-config.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SecurityAuditService } from '../services/security-audit.service';
import { timeout, retry, map } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { AuditEvent } from './universal-connector-types';

// Create a proper interface for error handling that extends Error properly
interface ErrorWithContext extends Error {
  category: string;
  service: string;
  endpoint: string;
  authType?: string;
  sessionId?: string;
}

// Define the exact structure of credentials to avoid index signature issues
interface AsmCredentials {
  accountId: string;
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
  [key: string]: string | undefined; // Add index signature for string access
}

// Update ConnectionConfig to use our credentials interface
interface AsmConnectionConfig extends ConnectionConfig {
  credentials: AsmCredentials;
}

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

  async initialize(config: AsmConnectionConfig): Promise<AsmSession> {
    try {
      this.validateConfig(config);
      
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_INIT`,
        severity: 'MEDIUM',
        category: 'SYSTEM',
        context: {
          endpoint: config.baseUrl,
          authType: config.authType
        }
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
        category: 'SYSTEM',
        context: {}
      });

      return this.session;

    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)), config);
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
        category: 'SYSTEM',
        context: {}
      });

    } catch (error) {
      const errorContext = {
        service: this.SERVICE_TYPE,
        endpoint: connection.baseUrl,
        sessionId: connection.sessionId
      };
      
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_ERROR`,
        severity: 'HIGH',
        category: 'SYSTEM',
        context: errorContext
      });
      
      // Create an error object with the required properties
      const errorWithContext = new Error(error instanceof Error ? error.message : String(error));
      Object.assign(errorWithContext, {
        ...errorContext,
        category: 'TERMINATION',
        name: error instanceof Error ? error.name : 'Error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      this.errorHandler.handleError(errorWithContext as unknown as ErrorWithContext);
    } finally {
      this.session = null;
    }
  }

  validateConfig(config: AsmConnectionConfig): boolean {
    const requiredFields = ['accountId', 'apiKey'];
    const missing = requiredFields.filter(f => !config.credentials[f]);
    
    if (missing.length > 0) {
      const error = new Error(`Configuration ${this.SERVICE_TYPE} manquante : ${missing.join(', ')}`);
      
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONFIG_ERROR`,
        severity: 'HIGH',
        category: 'SYSTEM',
        context: {
          missingFields: missing,
          authType: config.authType
        }
      });

      throw error;
    }
    return true;
  }

  private buildAuthPayload(config: AsmConnectionConfig): Record<string, string> {
    return {
      account_id: config.credentials.accountId,
      api_key: config.credentials.apiKey,
      scope: 'assets:read scan:execute'
    };
  }

  private getAuthHeaders(config: AsmConnectionConfig): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-ASM-Client': 'SecureHunter/2.0'
    });
  }

  private normalizeSession(config: AsmConnectionConfig, response: AsmAuthResponse): AsmSession {
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

  private handleError(error: Error, config: AsmConnectionConfig): void {
    const errorContext = {
      service: this.SERVICE_TYPE,
      endpoint: config.baseUrl,
      authType: config.authType
    };

    this.securityAudit.log({
      eventType: `${this.SERVICE_TYPE}_ERROR`,
      severity: 'HIGH',
      category: 'SYSTEM',
      context: errorContext
    });
    
    // Create an error object with the required properties
    const errorWithContext = new Error(error.message);
    Object.assign(errorWithContext, {
      ...errorContext,
      category: 'CONNECTION',
      name: error.name,
      stack: error.stack
    });
    
    this.errorHandler.handleError(errorWithContext as unknown as ErrorWithContext);
  }
}