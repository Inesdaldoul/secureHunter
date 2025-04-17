import { InjectionToken } from '@angular/core';

export interface AuditConfig {
  bufferSize: number;
  retentionDays: number;
  encryptionKey: string;
}

export const SESSION_CONFIG = new InjectionToken<AuditConfig>('AuditConfig');