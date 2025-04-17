import { Injectable, Inject, Optional } from '@angular/core';
import { UniversalConnector, ServiceType } from '../connectors/universal-connector.service';
import { LocalStorageService } from './local-storage.service';
import { NetworkService } from './network.service';
import { AuthService } from './auth.service';
import { SESSION_CONFIG, AuditConfig } from '../config/audit-config';
import { environment } from '../../../environments/environment';
// TODO: Si vous avez un CryptoService, assurez-vous qu'il existe et que le chemin est correct
import { CryptoService } from './crypto.service';
// TODO: Si vous avez un DeviceService, assurez-vous qu'il existe et que le chemin est correct
import { DeviceService } from './../services/device.service';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditEvent {
  eventType: string;
  severity: AuditSeverity;
  category: 'SYSTEM' | 'SECURITY' | 'USER';
  context: Record<string, unknown>;
  timestamp: Date;
  metadata: {
    sessionId: string;
    deviceId: string;
    userAgent: string;
    ipHash: string;
    environment: string;
  };
  // Champs optionnels selon le type d'événement
  subsystem?: string;
  threatLevel?: number;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class SecurityAuditService {
  logDashboardEvent: any;
  logDataIncident: any;
  logError(arg0: { eventType: string; severity: string; context: { service: ServiceType; }; error: Error; }) {
    throw new Error('Method not implemented.');
  }
  private eventBuffer: AuditEvent[] = [];
  private readonly encryptionKey: string;
  private readonly BUFFER_SIZE: number;
  private readonly MAX_RETRIES = 3;
  private retryCount = 0;

  constructor(
    private connector: UniversalConnector,
    private storage: LocalStorageService,
    private network: NetworkService,
    private crypto: CryptoService,
    private auth: AuthService,
    private device: DeviceService,
    @Optional() @Inject(SESSION_CONFIG) config?: AuditConfig
  ) {
    this.BUFFER_SIZE = config?.bufferSize ?? 20;
    this.encryptionKey = environment.AUDIT_ENCRYPTION_KEY || 'default-secure-key';
    this.initializeBufferRecovery();
  }

  private async initializeBufferRecovery() {
    try {
      const encryptedLogs = await this.storage.get<string>('audit_logs');
      if (encryptedLogs) {
        const decrypted = await this.crypto.decrypt(encryptedLogs, this.encryptionKey);
        this.eventBuffer = (JSON.parse(decrypted) as AuditEvent[]) || [];
        await this.flushLogs();
      }
    } catch (error: any) {
      console.error('Failed to recover audit logs:', this.sanitizeError(error));
    }
  }

  async log(event: Omit<AuditEvent, 'timestamp' | 'metadata'>) {
    const completeEvent: AuditEvent = {
      ...event,
      timestamp: new Date(),
      metadata: {
        sessionId: this.auth.currentSessionId ?? 'anonymous',
        deviceId: await this.device.getSecureDeviceId(),
        userAgent: navigator.userAgent,
        ipHash: this.crypto.hash(await this.network.getClientIp()),
        environment: environment.production ? 'production' : 'development'
      }
    };

    this.eventBuffer.push(completeEvent);
    if (this.eventBuffer.length >= this.BUFFER_SIZE) {
      await this.flushLogs();
    }
  }

  async logSecurityIncident(payload: {
    eventType: string;
    severity: AuditSeverity;
    context: Record<string, unknown>;
    error?: Error;
  }) {
    const sanitizedError = payload.error ? this.sanitizeError(payload.error) : undefined;

    await this.log({
      ...payload,
      category: 'SECURITY',
      threatLevel: this.calculateThreatLevel(payload.severity),
      context: {
        ...payload.context,
        ...(sanitizedError && { error: sanitizedError })
      }
    });
  }

  private calculateThreatLevel(severity: AuditSeverity): number {
    const levels: Record<AuditSeverity, number> = { LOW: 1, MEDIUM: 3, HIGH: 5, CRITICAL: 10 };
    return levels[severity] + (environment.production ? 0 : -1);
  }

  private sanitizeError(error: Error) {
    return {
      name: error.name,
      message: error.message.replace(/password=['"][^'"]+['"]/gi, 'password=***'),
      stack: error.stack?.split('\n').map(line =>
        line.replace(/(at .* \()(.*)(:.*:.*\))/, (_, pre, path, post) =>
          `${pre}${path.split('/').pop()}${post}`
        )
      )
    };
  }

  private async flushLogs(): Promise<void> {
    if (!this.eventBuffer.length) return;

    try {
      if (!this.network.isOnline) {
        await this.persistBuffer();
        return;
      }

      const payload = await this.prepareEncryptedPayload();
      await this.connector
        .getServiceConnection(ServiceType.SOAR)
        .logSecurityEvents(payload);

      this.eventBuffer = [];
      this.retryCount = 0;
    } catch (error: any) {
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        setTimeout(() => this.flushLogs(), 3000 * this.retryCount);
      } else {
        await this.persistBuffer();
        throw new Error('Audit log flush failed after retries');
      }
    }
  }

  private async persistBuffer(): Promise<void> {
    try {
      const encrypted = await this.crypto.encrypt(
        JSON.stringify(this.eventBuffer),
        this.encryptionKey
      );
      await this.storage.set('audit_logs', encrypted);
    } catch (error: any) {
      console.error('Critical failure persisting audit logs:', this.sanitizeError(error));
    }
  }

  private async prepareEncryptedPayload() {
    const payloadString = JSON.stringify(this.eventBuffer);
    const encryptedPayload = await this.crypto.encrypt(payloadString, this.encryptionKey);
    return {
      environment: environment.production ? 'production' : 'development',
      timestamp: new Date().toISOString(),
      checksum: this.crypto.hash(payloadString),
      payload: encryptedPayload
    };
  }
}