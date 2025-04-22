import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractAdapter } from '../interfaces/adapter.interface';
import { ConnectionConfig } from '../interfaces/connection-config.interface';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SecurityAuditService } from '../services/security-audit.service';
import { timeout, retry } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';

interface ApiConnectionResponse {
  token: string; // Ensure the response contains a token property
  logoutUrl: string; // Example of an additional property
}

@Injectable({ providedIn: 'root' })
export class ViAdapter implements AbstractAdapter {
  private apiConnection: { [key: string]: any } = {}; // Adjusted to use index signature
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT = 10000;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private securityAudit: SecurityAuditService
  ) {}

  /**
   * Initialise la connexion au service VI
   * @param config Configuration de connexion
   * @returns Promise avec l'instance de connexion
   */
  async initialize(config: ConnectionConfig): Promise<any> {
    try {
      this.validateConfig(config);

      this.securityAudit.log({
        eventType: 'VI_CONNECTION_ATTEMPT',
        severity: 'MEDIUM',
        category: 'SYSTEM',
        context: {
          endpoint: config.baseUrl,
          authType: config.authType
        }
      });

      // Ensure the response type is ApiConnectionResponse
      const connection: ApiConnectionResponse = await lastValueFrom(
        this.http.post<ApiConnectionResponse>(
          `${config.baseUrl}/authenticate`,
          { credentials: config.credentials },
          { headers: this.getAuthHeaders(config) }
        ).pipe(
          timeout(this.TIMEOUT),
          retry(this.MAX_RETRIES)
        )
      );

      // Store the connection details
      this.apiConnection = {
        instance: connection,
        jwt: connection.token, // Now accessing the token correctly
        lastPing: Date.now()
      };

      this.securityAudit.log({
        eventType: 'VI_CONNECTION_SUCCESS',
        severity: 'LOW',
        category: 'SYSTEM',
        context: {}
      });

      return this.apiConnection;

    } catch (error) {
      this.handleError(error, config.baseUrl);
      throw error;
    }
  }

  /**
   * Termine la connexion au service VI
   * @param connection Instance de connexion
   */
  async terminate(connection: any): Promise<void> {
    try {
      await lastValueFrom(
        this.http.post(
          `${connection.instance.logoutUrl}`, 
          {},
          { headers: { Authorization: `Bearer ${connection.jwt}` } }
        )
      );
      
      this.securityAudit.log({
        eventType: 'VI_CONNECTION_TERMINATED',
        severity: 'LOW',
        category: 'SYSTEM',
        context: {}
      });
    } catch (error) {
      this.errorHandler.handleError({
        error,
        service: 'VI',
        category: 'CONNECTION'
      });
    }
  }

  /**
   * Valide la configuration de connexion
   * @param config Configuration à valider
   */
  validateConfig(config: ConnectionConfig): boolean {
    const requiredKeys = ['authType', 'credentials', 'baseUrl'];
    if (!requiredKeys.every(k => config.hasOwnProperty(k))) {
      const error = new Error('Configuration VI invalide');
      this.securityAudit.log({
        eventType: 'VI_CONFIG_ERROR',
        severity: 'HIGH',
        category: 'SYSTEM',
        context: { error: error.message }
      });
      throw error;
    }
    return true;
  }

  private getAuthHeaders(config: ConnectionConfig): { [header: string]: string } {
    return config.authType === 'apiKey' 
      ? { 'X-API-KEY': config.credentials.apiKey }
      : { Authorization: `Bearer ${config.credentials['jwt']}` };
  }

  private handleError(error: any, endpoint: string): void {
    this.securityAudit.log({
      eventType: 'VI_CONNECTION_FAILED',
      severity: 'HIGH',
      category: 'SYSTEM',
      context: {
        error: error.message,
        endpoint
      }
    });
    
    this.errorHandler.handleError({
      error,
      service: 'VI',
      category: 'CONNECTION',
      severity: 'HIGH'
    });
  }
}
