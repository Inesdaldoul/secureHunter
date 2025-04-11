// soar-data.service.ts
import { Injectable } from '@angular/core';
import { UniversalConnector } from '../../../core/connectors/universal-connector.service';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SoarDataService {
  realtimeIncidents$ = new BehaviorSubject<any[]>([]);
  private connection: any;

  constructor(
    private connector: UniversalConnector,
    private auditService: SecurityAuditService,
    private errorHandler: ErrorHandlerService
  ) {}

  async initialize() {
    this.connection = await this.connector.connect('soar', {
      authType: 'jwt',
      credentials: { /* ... */ }
    });
    this.setupRealtime();
  }

  private setupRealtime() {
    this.connection.realtimeChannel.subscribe('incidents', {
      onData: (incident: any) => {
        this.realtimeIncidents$.next([...this.realtimeIncidents$.value, incident]);
      }
    });
  }

  async getIncidents(filters: any) {
    try {
      const response = await this.connection.api.get('/incidents', { params: filters });
      this.auditService.logDataRequest('SOAR_INCIDENTS', filters);
      return response.data;
    } catch (error) {
      this.errorHandler.handleError(error, { service: 'SOAR' });
      throw error;
    }
  }

  async executeWorkflow(workflowId: string) {
    const response = await this.connection.api.post(`/workflows/${workflowId}/execute`);
    this.auditService.logSecurityEvent('WORKFLOW_EXECUTION', {
      workflowId,
      status: response.status
    });
    return response.data;
  }
}