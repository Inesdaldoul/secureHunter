// src/app/core/connectors/universal-connector-types.ts
export enum ServiceType {
  VI = 'vi',
  CTI = 'cti',
  ASM = 'asm',
  SOAR = 'soar'
}

export type SessionValidationResult = {
  isValid: boolean;
  expiration: number;
  token: string;
};

export interface AuditEvent {
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SYSTEM' | 'SECURITY' | 'USER';
  context: Record<string, unknown>;
  timestamp?: Date;
  metadata?: {
    sessionId: string;
    deviceId: string;
    userAgent: string;
    ipHash: string;
    environment: string;
  };
}