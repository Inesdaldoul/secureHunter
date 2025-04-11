// asm-data.service.ts
import { Injectable } from '@angular/core';
import { UniversalConnector } from '../../../core/connectors/universal-connector.service';
import { SecurityAuditService } from '../../../core/services/security-audit.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AsmDataService {
  realtimeUpdates$ = new BehaviorSubject<any>(null);
  private connection: any;

  constructor(
    private connector: UniversalConnector,
    private auditService: SecurityAuditService,
    private errorHandler: ErrorHandlerService
  ) {}

  async initialize() {
    this.connection = await this.connector.connect('asm', {
      authType: 'apiKey',
      credentials: { /* ... */ }
    });
    this.setupRealtime();
  }

  private setupRealtime() {
    this.connection.realtimeChannel.subscribe('surface-updates', {
      onData: (update: any) => this.realtimeUpdates$.next(update),
      onError: (error: any) => this.errorHandler.handleError(error)
    });
  }

  async getAttackSurface(): Promise<any> {
    try {
      const response = await this.connection.api.get('/surface');
      this.auditService.logDataRequest('ASM_SURFACE_DATA');
      return response.data;
    } catch (error) {
      this.errorHandler.handleError(error, { service: 'ASM' });
      throw error;
    }
  }

  async runAssetScan(assetId: string): Promise<void> {
    await this.connection.api.post(`/assets/${assetId}/scan`);
    this.auditService.logUserAction('ASSET_SCAN_INITIATED', { assetId });
  }
}