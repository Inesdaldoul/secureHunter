// cti-data.service.ts
import { Injectable } from '@angular/core';
import { UniversalConnector } from '../../../core/connectors/universal-connector.service';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CtiDataService {
  private connection: any;
  realtimeThreats$ = new BehaviorSubject<any[]>([]);

  constructor(
    private connector: UniversalConnector,
    private auditService: SecurityAuditService,
    private errorHandler: ErrorHandlerService
  ) {}

  async initialize() {
    this.connection = await this.connector.connect('cti', {
      authType: 'oauth2',
      credentials: { /* ... */ }
    });
    this.setupRealtime();
  }

  private setupRealtime() {
    this.connection.realtimeChannel.subscribe('threats', {
      onData: (data: any) => {
        this.realtimeThreats$.next([...this.realtimeThreats$.value, data]);
        this.auditService.logRealtimeEvent('CTI_UPDATE', data);
      },
      onError: (error: any) => this.errorHandler.handleError(error)
    });
  }

  async getGlobalThreats(params?: any): Promise<any[]> {
    try {
      const response = await this.connection.api.get('/threats/global', { params });
      this.auditService.logDataRequest('CTI_DATA', params);
      return response.data;
    } catch (error) {
      this.errorHandler.handleError(error, { service: 'CTI' });
      throw error;
    }
  }
}