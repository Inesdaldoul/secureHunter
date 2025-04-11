// vi-data.service.ts
import { Injectable } from '@angular/core';
import { UniversalConnector, ServiceType } from '../../../core/connectors/universal-connector.service';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { Threat } from '../../../core/interfaces/threat.interface';

@Injectable({ providedIn: 'root' })
export class ViDataService {
  private connection: any;

  constructor(
    private connector: UniversalConnector,
    private auditService: SecurityAuditService,
    private errorHandler: ErrorHandlerService
  ) {}

  async initialize() {
    this.connection = await this.connector.connect(ServiceType.VI, {
      authType: 'jwt',
      credentials: { /* ... */ }
    });
  }

  async getVulnerabilities(params: {
    timeframe: string;
    severity: string;
  }): Promise<Threat[]> {
    try {
      const response = await this.connection.api.get('/vulnerabilities', { params });
      this.auditService.logDataRequest('VI_DATA', params);
      return response.data;

    } catch (error) {
      this.errorHandler.handleError(error, {
        service: 'VI',
        category: 'DATA_FETCH'
      });
      throw error;
    }
  }

  subscribeToRealTime() {
    return this.connection.realtimeChannel.subscribe('vulnerabilities', {
      onData: (data: any) => {
        this.auditService.logRealtimeEvent('VI_UPDATE', data);
        // Handle real-time updates
      }
    });
  }
}