import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractAdapter } from '../interfaces/adapter.interface';
import { ConnectionConfig } from '../interfaces/connection-config.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SecurityAuditService } from '../services/security-audit.service';
import { timeout, retry } from 'rxjs/operators';
import { AuthResponse } from '../interfaces/auth-response.interface';
import { ConnectionObject } from '../interfaces/connection-object.interface';

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
        context: {
          endpoint: config.baseUrl,
          authType: config.authType
        }
      });

      const response = await this.http.post<AuthResponse>(
        `${config.baseUrl}/v3/auth/token`,
        this.buildAuthPayload(config),
        { headers: this.getCTIHeaders(config) }
      )
      .pipe(
        timeout(this.TIMEOUT),
        retry(this.MAX_RETRIES)
      )
      .toPromise();

      this.connection = this.buildConnectionObject(config, response);
      this.startTokenRefresh(response.expires_in);
      
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_SUCCESS`
      });
      
      return this.connection;

    } catch (error) {
      this.errorHandler.handleError({
        error,
        service: this.SERVICE_TYPE,
        category: 'INITIALIZATION',
        endpoint: config.baseUrl
      });
      throw error;
    }
  }

  async terminate(connection: ConnectionObject): Promise<void> {
    try {
      await this.http.delete(
        `${connection.baseUrl}/v3/auth/token`,
        { headers: this.getAuthHeaders(connection.accessToken) }
      ).toPromise();
      
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONNECTION_CLOSED`
      });
    } catch (error) {
      this.errorHandler.handleError({
        error,
        service: this.SERVICE_TYPE,
        category: 'TERMINATION'
      });
    } finally {
      clearTimeout(this.tokenRefreshTimer);
      this.connection = undefined;
    }
  }

  validateConfig(config: ConnectionConfig): boolean {
    const requiredFields: (keyof ConnectionConfig['credentials'])[] = ['clientId', 'clientSecret'];
    const missing = requiredFields.filter(f => !config.credentials?.[f]);
    
    if (missing.length > 0) {
      const error = new Error(`Champs CTI manquants : ${missing.join(', ')}`);
      this.securityAudit.log({
        eventType: `${this.SERVICE_TYPE}_CONFIG_ERROR`,
        context: { error: error.message }
      });
      throw error;
    }
    return true;
  }

  private buildAuthPayload(config: ConnectionConfig): { grant_type: string; client_id: string; client_secret: string; scope: string } {
    return {
      grant_type: 'client_credentials',
      client_id: config.credentials.clientId!,
      client_secret: config.credentials.clientSecret!,
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
        this.errorHandler.handleError({
          error,
          service: this.SERVICE_TYPE,
          category: 'TOKEN_REFRESH',
          endpoint: this.connection?.baseUrl
        });
      }
    }, refreshTime);
  }

  private async refreshToken(): Promise<void> {
    if (!this.connection?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.http.post<AuthResponse>(
      `${this.connection.baseUrl}/v3/auth/refresh`,
      { refresh_token: this.connection.refreshToken },
      { headers: this.getCTIHeaders(this.connection) }
    ).pipe(
      timeout(this.TIMEOUT),
      retry(this.MAX_RETRIES)
    ).toPromise();

    this.connection.accessToken = response.access_token;
    this.connection.expiration = Date.now() + (response.expires_in * 1000);
    this.startTokenRefresh(response.expires_in);

    this.securityAudit.log({
      eventType: `${this.SERVICE_TYPE}_TOKEN_REFRESHED`,
      context: { newExpiration: this.connection.expiration }
    });
  }
}