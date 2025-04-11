import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractAdapter } from '../interfaces/adapter.interface';
import { ConnectionConfig } from '../interfaces/connection-config.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SecurityAuditService } from '../services/security-audit.service';
import { timeout, retry } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SoarAdapter implements AbstractAdapter {
  private readonly SERVICE_TYPE = 'soar';
  private readonly TIMEOUT = 30000;
  private readonly MAX_RETRIES = 4;
  private session: any;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private securityAudit: SecurityAuditService
  ) {}

  async initialize(config: ConnectionConfig): Promise<any> {
    try {
      this.validateConfig(config);
      
      this.securityAudit.log(`${this.SERVICE_TYPE}_CONNECTION_START`, {
        endpoint: config.baseUrl,
        authType: config.authType
      });

      const response = await this.http.post<any>(
        `${config.baseUrl}/api/v1/auth`,
        this.buildAuthBody(config),
        { headers: this.getAuthHeaders(config) }
      )
      .pipe(
        timeout(this.TIMEOUT),
        retry(this.MAX_RETRIES)
      )
      .toPromise();

      this.session = this.normalizeSession(config, response);
      this.securityAudit.log(`${this.SERVICE_TYPE}_CONNECTION_SUCCESS`);
      
      return this.session;

    } catch (error) {
      this.handleError(error, config.baseUrl);
      throw error;
    }
  }

  async terminate(connection: any): Promise<void> {
    try {
      await this.http.post(
        `${connection.baseUrl}/api/v1/auth/logout`,
        {},
        { headers: this.getSessionHeaders(connection) }
      ).toPromise();
      
      this.securityAudit.log(`${this.SERVICE_TYPE}_CONNECTION_CLOSED`);
    } catch (error) {
      this.errorHandler.handleError(error, {
        service: this.SERVICE_TYPE,
        category: 'TERMINATION'
      });
    }
  }

  validateConfig(config: ConnectionConfig): boolean {
    const requiredFields = ['username', 'apiKey'];
    const missing = requiredFields.filter(f => !config.credentials?.[f]);
    
    if (missing.length > 0) {
      const error = new Error(`Configuration ${this.SERVICE_TYPE} invalide : ${missing.join(', ')} manquant`);
      this.securityAudit.log(`${this.SERVICE_TYPE}_CONFIG_ERROR`, { error: error.message });
      throw error;
    }
    return true;
  }

  private buildAuthBody(config: ConnectionConfig): any {
    return {
      username: config.credentials.username,
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

  private getSessionHeaders(connection: any): { [header: string]: string } {
    return {
      'Authorization': `Bearer ${connection.sessionToken}`,
      'X-Session-ID': connection.sessionId
    };
  }

  private normalizeSession(config: ConnectionConfig, response: any): any {
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
    const errorData = {
      service: this.SERVICE_TYPE,
      context,
      status: error.status || 500,
      message: error.message
    };

    this.securityAudit.log(`${this.SERVICE_TYPE}_ERROR`, errorData);
    this.errorHandler.handleError(error, {
      ...errorData,
      category: 'CONNECTION',
      severity: error.status === 403 ? 'CRITICAL' : 'HIGH'
    });
  }
}