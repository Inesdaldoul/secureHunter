// src/app/core/config/audit-config.ts
import { InjectionToken } from '@angular/core';

export interface AuditConfig {
  bufferSize: number;
  retryDelay?: number;
  persistEvents?: boolean;
}

export const SESSION_CONFIG = new InjectionToken<AuditConfig>('SESSION_CONFIG');

export const defaultAuditConfig: AuditConfig = {
  bufferSize: 20,
  retryDelay: 3000,
  persistEvents: true
};