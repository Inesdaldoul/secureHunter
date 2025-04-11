// src/app/core/services/security-audit.service.ts
import { Injectable, Inject, Optional } from '@angular/core';
import { UniversalConnector, ServiceType } from '../connectors/universal-connector.service';
import { SESSION_CONFIG, AuditConfig } from '../config/audit.config';
import { LocalStorageService } from './local-storage.service';
import { NetworkService } from './network.service';
import { CryptoService } from './crypto.service';
import { EnvironmentService } from './environment.service';
import { AuthService } from '../../auth/services/auth.service';
import { DeviceService } from './device.service';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface AuditEventBase {
  eventType: string;
  severity: AuditSeverity;
  context: Record<string, unknown>;
}

interface SystemAuditEvent extends AuditEventBase {
  category: 'SYSTEM';
  subsystem: string;
}

interface SecurityAuditEvent extends AuditEventBase {
  category: 'SECURITY';
  threatLevel: number;
}

interface UserAuditEvent extends AuditEventBase {
  category: 'USER';
  userId: string;
}

type AuditEvent = (SystemAuditEvent | SecurityAuditEvent | UserAuditEvent) & {
  timestamp: Date;
  metadata: {
    sessionId: string;
    deviceId: string;
    userAgent: string;
    ipHash: string;
    environment: string;
  };
};

@Injectable({ providedIn: 'root' })
export class SecurityAuditService {
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
    private env: EnvironmentService,
    @Optional() @Inject(SESSION_CONFIG) config?: AuditConfig
  ) {
    this.BUFFER_SIZE = config?.bufferSize || 20;
    this.encryptionKey = this.env.get('AUDIT_ENCRYPTION_KEY') || 'fallback-key-needs-change';
    this.initializeBufferRecovery();
  }

  private async initializeBufferRecovery() {
    try {
      const encryptedLogs = await this.storage.get<string>('audit_logs');
      if (encryptedLogs) {
        const decrypted = await this.crypto.decrypt(encryptedLogs, this.encryptionKey);
        this.eventBuffer = JSON.parse(decrypted) || [];
        await this.flushLogs();
      }
    } catch (error) {
      console.error('Failed to recover audit logs:', this.sanitizeError(error));
    }
  }

  async log(event: Omit<AuditEvent, 'timestamp' | 'metadata'>) {
    const completeEvent: AuditEvent = {
      ...event,
      timestamp: new Date(),
      metadata: {
        sessionId: this.auth.currentSessionId || 'anonymous',
        deviceId: await this.device.getSecureDeviceId(),
        userAgent: navigator.userAgent,
        ipHash: this.crypto.hash(await this.network.getClientIP()),
        environment: this.env.current
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
    
    const event: SecurityAuditEvent = {
      ...payload,
      category: 'SECURITY',
      context: {
        ...payload.context,
        ...(sanitizedError && { error: sanitizedError })
      },
      threatLevel: this.calculateThreatLevel(payload.severity)
    };

    await this.log(event);
  }

  private calculateThreatLevel(severity: AuditSeverity): number {
    const levels = { LOW: 1, MEDIUM: 3, HIGH: 5, CRITICAL: 10 };
    return levels[severity] + (this.env.production ? 0 : -1);
  }

  private sanitizeError(error: Error): Record<string, unknown> {
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
    if (this.eventBuffer.length === 0) return;

    try {
      if (!this.network.isOnline) {
        await this.persistBuffer();
        return;
      }

      const payload = this.prepareEncryptedPayload();
      await this.connector
        .getServiceConnection(ServiceType.SOAR)
        .logSecurityEvents(payload);

      this.eventBuffer = [];
      this.retryCount = 0;
    } catch (error) {
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
    } catch (error) {
      console.error('Critical failure persisting audit logs:', 
        this.sanitizeError(error as Error));
    }
  }

  private prepareEncryptedPayload() {
    return {
      environment: this.env.current,
      timestamp: new Date().toISOString(),
      checksum: this.crypto.hash(JSON.stringify(this.eventBuffer)),
      payload: this.crypto.encrypt(
        JSON.stringify(this.eventBuffer),
        this.encryptionKey
      )
    };
  }
}