import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractAdapter } from '../interfaces/adapter.interface';
import { ConnectionConfig } from '../interfaces/connection-config.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SecurityAuditService } from '../services/security-audit.service';
import { timeout, retry } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { AuditEvent } from './universal-connector-types';

interface SoarSession {
  sessionToken: string;
  sessionId: string;
  baseUrl: string;
  endpoints: {
    incidents: string;
    workflows: string;
  };
  expiration: number;
}

interface SoarAuthResponse {
  session_token: string;
  session_id: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class SoarAdapter implements AbstractAdapter {
  private readonly SERVICE_TYPE = 'soar';
  private readonly TIMEOUT = 30000;
  private readonly MAX_RETRIES = 4;
  private session: SoarSession | null = null;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private securityAudit: SecurityAuditService
  ) {}

  async initialize(config: ConnectionConfig): Promise<SoarSession> {
    try {
      this.validateConfig(config);

      // Log connection start
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_START`,
        severity: 'MEDIUM',
        category: 'SYSTEM',
        context: {
          endpoint: config.baseUrl,
          authType: config.authType
        }
      });

      // Make the authentication request
      const response = await lastValueFrom(
        this.http.post<SoarAuthResponse>(
          `${config.baseUrl}/api/v1/auth`,
          this.buildAuthBody(config),
          { headers: this.getAuthHeaders(config) }
        ).pipe(
          timeout(this.TIMEOUT),
          retry(this.MAX_RETRIES)
        )
      );

      // Normalize and store session
      this.session = this.normalizeSession(config, response);

      // Log connection success
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_SUCCESS`,
        severity: 'LOW',
        category: 'SYSTEM',
        context: {}
      });

      return this.session;

    } catch (error) {
      // Handle error
      this.handleError(error, config.baseUrl);
      throw error;
    }
  }

  async terminate(connection: SoarSession): Promise<void> {
    try {
      // Attempt to log out
      await lastValueFrom(
        this.http.post(
          `${connection.baseUrl}/api/v1/auth/logout`,
          {},
          { headers: this.getSessionHeaders(connection) }
        )
      );

      // Log connection closed
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_CLOSED`,
        severity: 'LOW',
        category: 'SYSTEM',
        context: {}
      });

    } catch (error) {
      // Log error during termination
      this.errorHandler.handleError({
        error,
        service: this.SERVICE_TYPE,
        category: 'TERMINATION'
      });
    }
  }

  validateConfig(config: ConnectionConfig): boolean {
    const requiredFields = ['username', 'apiKey'];
    const missing = requiredFields.filter(f => !config.credentials?.[f]);

    if (missing.length > 0) {
      const error = new Error(`Configuration ${this.SERVICE_TYPE} invalid: ${missing.join(', ')} missing`);

      // Log config error
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONFIG_ERROR`,
        severity: 'HIGH',
        category: 'SYSTEM',
        context: { error: error.message }
      });

      throw error;
    }
    return true;
  }

  private buildAuthBody(config: ConnectionConfig): Record<string, any> {
    return {
      username: config.credentials['username'],
      api_key: config.credentials.apiKey,
      scope: 'incidents:read workflows:execute'
    };
  }

  private getAuthHeaders(config: ConnectionConfig): { [header: string]: string } {
    return {
      'Content-Type': 'application/json',
      'X-SOAR-Integration': 'SecureHunter v3.0'
    };
  }

  private getSessionHeaders(connection: SoarSession): { [header: string]: string } {
    return {
      'Authorization': `Bearer ${connection.sessionToken}`,
      'X-Session-ID': connection.sessionId
    };
  }

  private normalizeSession(config: ConnectionConfig, response: SoarAuthResponse): SoarSession {
    return {
      sessionToken: response.session_token,
      sessionId: response.session_id,
      baseUrl: config.baseUrl,
      endpoints: {
        incidents: `${config.baseUrl}/api/v1/incidents`,
        workflows: `${config.baseUrl}/api/v1/workflows`
      },
      expiration: Date.now() + (response.expires_in * 1000)
    };
  }

  private handleError(error: any, context: string): void {
    // Structured error data for logging and handling
    const errorData = {
      service: this.SERVICE_TYPE,
      context,
      status: error.status || 500,
      message: error.message || 'Unknown error'
    };

    // Log error event
    this.securityAudit.log({
      eventType: `${this.SERVICE_TYPE}_ERROR`,
      severity: 'HIGH',
      category: 'SYSTEM',
      context: errorData
    });

    // Handle the error
    this.errorHandler.handleError({
      error,
      ...errorData,
      category: 'CONNECTION',
      severity: error.status === 403 ? 'CRITICAL' : 'HIGH'
    });
  }
}
