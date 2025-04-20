// src/app/core/services/security-audit.service.ts
import { Injectable } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { NetworkService } from './network.service';
import { AuthService } from './auth.service';
import { CryptoService } from './crypto.service';
import { DeviceService } from './device.service';
import { environment } from '../../../environments/environment';
import { UserRole } from './../models/user-role.model';
// Updated AuditEvent interface
export interface AuditEvent {
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
  error?: Error;
}

@Injectable({ providedIn: 'root' })
export class SecurityAuditService {
  private eventBuffer: AuditEvent[] = [];
  private readonly BUFFER_SIZE = 20;
  getCurrentUserRole: any;
  
  constructor(
    private storage: LocalStorageService,
    private network: NetworkService,
    private crypto: CryptoService,
    private auth: AuthService,
    private device: DeviceService
  ) {}
  
  async log(event: Omit<AuditEvent, 'timestamp' | 'metadata'>): Promise<void> {
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
  
  async logError(event: Omit<AuditEvent, 'timestamp' | 'metadata'>): Promise<void> {
    return this.log({
      ...event,
      severity: 'HIGH',
      category: 'SECURITY'
    });
  }
  
  // New method for logging security incidents (used in role.guard.ts)
  async logSecurityIncident(event: Omit<AuditEvent, 'timestamp' | 'metadata'>): Promise<void> {
    return this.log({
      ...event,
      category: 'SECURITY'
    });
  }
  
  // Missing method from errors
  getCurrentThreatLevel(): number {
    // Implementation based on your security model
    const session = this.getSessionMetadata();
    // Example logic - increase threat level for anonymous sessions
    if (session.sessionId === 'anonymous') {
      return 4;
    }
    return 2; // Default threat level
  }
  
  // Missing method from errors
  evaluateAccessPolicy(criteria: any): boolean {
    // Implement your policy evaluation logic
    if (!criteria || !criteria.role) {
      return false;
    }
    
    // Example implementation - fixed string comparison
    const requiredRole = criteria.role;
    const currentUserRole = this.auth.currentSessionId ? 'AUTHENTICATED' : 'GUEST';
    
    // Fix the string comparison issue
    if (requiredRole === 'ADMIN' && currentUserRole !== 'ADMIN') {
      return false;
    }
    
    // Simple role-based check
    if (requiredRole === 'AUTHENTICATED' && currentUserRole === 'GUEST') {
      return false;
    }
    
    return true;
  }
  
  // Missing method from errors
  getSessionMetadata() {
    return {
      sessionId: this.auth.currentSessionId ?? 'anonymous',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ipHash: localStorage.getItem('ip_hash') || ''
    };
  }
  
  
  private async flushLogs(): Promise<void> {
    // Implement your log flushing logic here
    try {
      // Example implementation:
      if (this.eventBuffer.length === 0) return;
     
      // Save logs to local storage if offline
      if (!this.network.isOnline) {
        await this.storage.set('audit_logs', JSON.stringify(this.eventBuffer));
        return;
      }
      // TODO: Implement actual log sending logic
      console.log('Flushing logs:', this.eventBuffer);
      this.eventBuffer = [];
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }
  
}