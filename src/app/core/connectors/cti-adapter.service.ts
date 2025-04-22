import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractAdapter } from '../interfaces/adapter.interface';
import { ConnectionConfig } from '../interfaces/connection-config.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SecurityAuditService } from '../services/security-audit.service';
import { timeout, retry } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { AuditEvent } from './universal-connector-types';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ConnectionObject {
  accessToken: string;
  refreshToken: string;
  baseUrl: string;
  expiration: number;
  endpoints: {
    indicators: string;
    threats: string;
  };
}

type AuditLogSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

interface ErrorDetails {
  error: unknown;
  service: string;
  category: string;
  endpoint?: string;
}

@Injectable({ providedIn: 'root' })
export class CtiAdapter implements AbstractAdapter {
  private readonly SERVICE_TYPE = 'cti';
  private connection?: ConnectionObject;
  private readonly MAX_RETRIES = 5;
  private readonly TIMEOUT = 15000;
  private tokenRefreshTimer: any;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private securityAudit: SecurityAuditService
  ) {}

  async initialize(config: ConnectionConfig): Promise<ConnectionObject> {
    try {
      this.validateConfig(config);

      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_ATTEMPT`,
        severity: 'MEDIUM',
        category: 'SYSTEM',
        context: {
          endpoint: config.baseUrl,
          authType: config.authType
        }
      });

      const response = await lastValueFrom(
        this.http.post<AuthResponse>(
          `${config.baseUrl}/v3/auth/token`,
          this.buildAuthPayload(config),
          { headers: this.getCTIHeaders(config) }
        ).pipe(
          timeout(this.TIMEOUT),
          retry(this.MAX_RETRIES)
        )
      );

      this.connection = this.buildConnectionObject(config, response);
      this.startTokenRefresh(response.expires_in);

      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_SUCCESS`,
        severity: 'LOW',
        category: 'SYSTEM',
        context: {}
      });

      return this.connection;

    } catch (error) {
      const errorDetails: ErrorDetails = {
        error,
        service: this.SERVICE_TYPE,
        category: 'INITIALIZATION',
        endpoint: config.baseUrl
      };
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(JSON.stringify(error))
      );
      throw error;
    }
  }

  async terminate(connection: ConnectionObject): Promise<void> {
    try {
      await lastValueFrom(
        this.http.delete(
          `${connection.baseUrl}/v3/auth/token`,
          { headers: this.getAuthHeaders(connection.accessToken) }
        )
      );

      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_CLOSED`,
        severity: 'LOW',
        category: 'SYSTEM',
        context: {}
      });
    } catch (error) {
      const errorDetails: ErrorDetails = {
        error,
        service: this.SERVICE_TYPE,
        category: 'TERMINATION'
      };
      this.errorHandler.handleError(errorDetails); // ✅ Accepts ErrorDetails
    } finally {
      clearTimeout(this.tokenRefreshTimer);
      this.connection = undefined;
    }
  }

  validateConfig(config: ConnectionConfig): boolean {
    if (!config.credentials) {
      throw new Error('No credentials provided');
    }

    const requiredFields = ['clientId', 'clientSecret'];
    const missing = requiredFields.filter(f => !(config.credentials as any)[f]);

    if (missing.length > 0) {
      const errorMessage = `Champs CTI manquants : ${missing.join(', ')}`;
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONFIG_ERROR`,
        severity: 'HIGH',
        category: 'SYSTEM',
        context: { errorMessage }
      });
      throw new Error(errorMessage);
    }
    return true;
  }

  private buildAuthPayload(config: ConnectionConfig): { grant_type: string; client_id: string; client_secret: string; scope: string } {
    return {
      grant_type: 'client_credentials',
      client_id: config.credentials.clientId as string,
      client_secret: config.credentials.clientSecret as string,
      scope: 'indicators:read threats:feed'
    };
  }

  private getCTIHeaders(config: ConnectionConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Integration-Name': 'SecureHunter',
      'X-Integration-Version': '2.4.0'
    };
  }

  private getAuthHeaders(token: string): { Authorization: string; 'Content-Type': string } {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private buildConnectionObject(config: ConnectionConfig, response: AuthResponse): ConnectionObject {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      baseUrl: config.baseUrl,
      expiration: Date.now() + (response.expires_in * 1000),
      endpoints: {
        indicators: `${config.baseUrl}/v3/indicators`,
        threats: `${config.baseUrl}/v3/threats`
      }
    };
  }

  private startTokenRefresh(expiresIn: number): void {
    const refreshTime = (expiresIn * 1000) - 60000;
    clearTimeout(this.tokenRefreshTimer);

    this.tokenRefreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        const errorDetails: ErrorDetails = {
          error,
          service: this.SERVICE_TYPE,
          category: 'TOKEN_REFRESH',
          endpoint: this.connection?.baseUrl
        };
        this.errorHandler.handleError(errorDetails); // ✅ Accepts ErrorDetails
      }
    }, refreshTime);
  }

  private async refreshToken(): Promise<void> {
    if (!this.connection?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const minConfig: ConnectionConfig = {
      baseUrl: this.connection.baseUrl,
      credentials: {
        accountId: 'cti-refresh',
        apiKey: 'dummy',
        clientId: '',
        clientSecret: ''
      },
      authType: 'apiKey'
    };

    const response = await lastValueFrom(
      this.http.post<AuthResponse>(
        `${this.connection.baseUrl}/v3/auth/refresh`,
        { refresh_token: this.connection.refreshToken },
        { headers: this.getCTIHeaders(minConfig) }
      ).pipe(
        timeout(this.TIMEOUT),
        retry(this.MAX_RETRIES)
      )
    );

    this.connection.accessToken = response.access_token;
    this.connection.expiration = Date.now() + (response.expires_in * 1000);
    this.startTokenRefresh(response.expires_in);

    this.securityAudit.log({
      eventType: `${this.SERVICE_TYPE}_TOKEN_REFRESHED`,
      severity: 'LOW',
      category: 'SYSTEM',
      context: { newExpiration: this.connection.expiration }
    });
  }
}
