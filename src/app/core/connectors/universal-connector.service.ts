import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ErrorHandlerService } from '../services/error-handler.service';
import { SecurityAuditService, AuditSeverity } from '../services/security-audit.service';
import { FeatureToggleService } from '../config/feature-toggles';
import { AbstractAdapter } from '../interfaces/adapter.interface';
import { ConnectionConfig } from '../interfaces/connection-config.interface';

export enum ServiceType {
  VI = 'vi',
  CTI = 'cti',
  ASM = 'asm',
  SOAR = 'soar'
}

interface ServiceConnection {
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class UniversalConnector {
  private adapters = new Map<ServiceType, AbstractAdapter>();
  private activeConnections = new Map<ServiceType, ServiceConnection>();

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private securityAudit: SecurityAuditService,
    private featureToggle: FeatureToggleService,
    @Optional() @Inject('API_ENDPOINTS') private apiEndpoints?: Record<ServiceType, string>
  ) {}

  getServiceConnection(type: ServiceType): any {
    const connection = this.activeConnections.get(type);
    if (!connection) {
      throw this.errorHandler.createError(
        'CONNECTION_ERROR',
        `No active connection for ${type}`,
        503
      );
    }
    return connection;
  }

  registerAdapter(type: ServiceType, adapter: AbstractAdapter): void {
    if (!this.featureToggle.isEnabled(type)) {
      this.securityAudit.log({
        eventType: 'ADAPTER_DISABLED',
        severity: 'MEDIUM',
        context: { service: type }
      });
      return;
    }

    this.adapters.set(type, adapter);
    this.securityAudit.log({
      eventType: 'ADAPTER_REGISTERED',
      severity: 'LOW',
      context: { service: type }
    });
  }

  async connect<T>(type: ServiceType, config: ConnectionConfig): Promise<T> {
    try {
      this.validateServiceType(type);
      const adapter = this.getAdapterInstance(type);
      
      const baseUrl = this.apiEndpoints?.[type] || config.baseUrl;
      if (!baseUrl?.startsWith('http')) {
        throw this.errorHandler.createError(
          'CONFIG_ERROR',
          `Invalid endpoint for ${type}: ${baseUrl}`,
          400
        );
      }

      const connection = await adapter.initialize({ ...config, baseUrl });
      
      this.activeConnections.set(type, connection);
      this.securityAudit.log({
        eventType: 'CONNECTION_SUCCESS',
        severity: 'LOW',
        context: { service: type }
      });
      
      return connection as T;
    } catch (error) {
      this.handleConnectionError(type, error as Error);
      throw error;
    }
  }

  private validateServiceType(type: ServiceType): void {
    if (!this.adapters.has(type)) {
      const errorMessage = `No adapter registered for ${type}`;
      this.securityAudit.logError({
        eventType: 'ADAPTER_NOT_FOUND',
        severity: 'HIGH',
        context: { service: type },
        error: new Error(errorMessage)
      });
      throw new Error(errorMessage);
    }
  }

  private getAdapterInstance(type: ServiceType): AbstractAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) {
      const error = this.errorHandler.createError(
        'ADAPTER_ERROR',
        `Adapter ${type} not initialized`,
        500
      );
      this.securityAudit.logError({
        eventType: 'ADAPTER_FAILURE',
        severity: 'CRITICAL',
        context: { service: type },
        error
      });
      throw error;
    }
    return adapter;
  }

  private handleConnectionError(type: ServiceType, error: Error): void {
    this.securityAudit.logError({
      eventType: 'CONNECTION_FAILED',
      severity: 'HIGH',
      context: { 
        service: type,
        endpoint: this.apiEndpoints?.[type],
        status: (error as any)?.statusCode || 500
      },
      error
    });
    
    this.errorHandler.handleError({
      error,
      service: type,
      category: 'CONNECTION'
    });
  }

  async disconnectAll(): Promise<void> {
    const results = await Promise.allSettled(
      Array.from(this.activeConnections).map(async ([type, connection]) => {
        try {
          const adapter = this.adapters.get(type);
          if (adapter) {
            await adapter.terminate(connection);
            this.securityAudit.log({
              eventType: 'CONNECTION_CLOSED',
              severity: 'LOW',
              context: { service: type }
            });
          }
        } catch (error) {
          this.errorHandler.handleError({
            error: error as Error,
            service: type,
            category: 'DISCONNECT'
          });
        }
      })
    );

    this.handleDisconnectResults(results);
    this.activeConnections.clear();
  }

  private handleDisconnectResults(results: PromiseSettledResult<void>[]): void {
    const errors = results.filter(r => r.status === 'rejected');
    if (errors.length > 0) {
      this.securityAudit.log({
        eventType: 'DISCONNECT_WARNINGS',
        severity: 'MEDIUM',
        context: { failedDisconnects: errors.length }
      });
    }
  }
}